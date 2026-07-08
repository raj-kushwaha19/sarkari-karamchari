require('dotenv').config();
const axios = require('axios');
const { resolveOfficialEmail, detectCategory, CATEGORY_LABELS, getStateFromPincode, VERIFIED_EMAILS } = require('../utils/deptEmailResolver');
const logger = require('../utils/logger');
const DepartmentEmailCache = require('../models/DepartmentEmailCache');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
let geminiModel = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
}

// ─────────────────────────────────────────────────────────
// AI PROMPT BUILDER
// ─────────────────────────────────────────────────────────
const buildClassifyPrompt = (rawText, pinCode, deptName, address) =>
`You are a highly professional government complaint email drafting assistant.

Citizen complaint (may be in Hindi/Hinglish/English): "${rawText}"
Location Pincode: ${pinCode}
Exact Location Address: ${address || 'Not provided'}
This complaint is being sent to: ${deptName}

Respond ONLY in valid JSON with these exact keys:
- subject: string — A concise, accurate email subject line in English that EXACTLY matches the citizen's issue. Do NOT mix topics.
- body: string — 2-3 paragraphs in highly professional English. 
  IMPORTANT RULES FOR BODY:
  1. Describe ONLY the citizen's actual problem.
  2. If an Exact Location Address is provided, you MUST explicitly state it at the very beginning of the body so authorities know exactly where the issue is. 
  3. Translate casual Hindi terms professionally (e.g. translate "gali" to "street", "khaba" to "broken", "nukkad" to "intersection", "dhaba" to "restaurant"). 
  4. Do NOT use awkward phrasing like "located at Gali". Use proper natural English.
  5. Do NOT write "Dear", "From", "To", "Subject", or any signature here. Just the raw paragraph content.
- summary: string — 1 sentence summary of the issue in English.
- confidence: number between 0.0 and 1.0
`;

// ─────────────────────────────────────────────────────────
// ROBUST MULTI-MODEL AI ENGINE (CASCADING FALLBACK)
// ─────────────────────────────────────────────────────────
const callAI = async (prompt, attempt = 1, isCategorization = false) => {
  const start = Date.now();
  
  // 1. Groq API Key Rotation Cascade (FASTEST & MOST RELIABLE)
  const groqKeys = (process.env.GROQ_API_KEYS || "").split(',').map(k => k.trim()).filter(Boolean);
  
  for (const [index, key] of groqKeys.entries()) {
    try {
      const { data } = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      }, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        timeout: 10000
      });
      const latency = Date.now() - start;
      logger.info(`[AI] Groq (llama-3.3-70b) success with Key #${index + 1} | ${latency}ms`);
      return data.choices[0].message.content;
    } catch (e) {
      logger.warn(`[AI] Groq Key #${index + 1} failed (${e.message}). Trying next key...`);
    }
  }

  // 2. Array of Gemini Models to try in order (Fallback)
  const geminiModelsToTry = ["gemini-3.5-flash", "gemini-1.5-pro", "gemini-1.5-flash"];
  
  if (genAI) {
    for (const modelName of geminiModelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        });
        
        const responseText = result.response.text();
        const latency = Date.now() - start;
        logger.info(`[AI] ${modelName} success | ${latency}ms`);
        return responseText;
      } catch (e) {
        logger.warn(`[AI] ${modelName} failed (${e.message}). Falling back to next model...`);
      }
    }
  }

  // 3. Local Ollama Fallback (If all Gemini models fail AND all 5 Groq keys fail)
  try {
    logger.info(`[AI] All Gemini models failed. Attempting Local Ollama fallback (${OLLAMA_MODEL})...`);
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json'
    }, { timeout: 15000 });
    
    const latency = Date.now() - start;
    logger.info(`[AI] Ollama success | ${latency}ms`);
    return response.data.response;
  } catch (err) {
    const latency = Date.now() - start;
    logger.error(`[AI] Ollama failed as well | ${latency}ms`, err.message);

    // Graceful fallback — never crash the app
    logger.warn('[AI] Gemini unreachable — using structured fallback response.');
    
    if (isCategorization) {
      throw new Error("AI unavailable for categorization");
    }
    
    // Extract a snippet for the subject
    const subjectSnippet = prompt.match(/Citizen complaint \([^)]+\):\s*"([^"]+)"/)?.[1]?.substring(0, 50) || 'Issue reported by citizen';
    const pin = prompt.match(/Pincode: (\d+)/)?.[1] || '';
    const address = prompt.match(/Exact Location Address: (.+)/)?.[1] || 'Not provided';
    const rawMatch = prompt.match(/Citizen complaint \([^)]+\):\s*"([^"]+)"/)?.[1] || 'Unspecified issue';

    return JSON.stringify({
      subject: `Complaint regarding: ${subjectSnippet} (Pincode ${pin})`,
      body: `Dear Authority,\n\nWe are writing to bring to your urgent attention the following serious issue reported by a resident in our area:\n\n"${rawMatch}"\n\nExact Location: ${address}\nPincode: ${pin}\n\nWe request immediate inspection and resolution at the earliest.`,
      summary: 'Citizen reported an issue requiring urgent attention.',
      confidence: 0.5,
    });
  }
};

// ─────────────────────────────────────────────────────────
// SMART EMAIL EXTRACTOR (Filters out IT/Webmaster emails)
// ─────────────────────────────────────────────────────────
const analyzeComplaintWithAI = async (rawText, pinCode, stateName) => {
  const prompt = `Analyze this citizen complaint from an Indian resident. 
Complaint: "${rawText}"
Pincode: ${pinCode} (State: ${stateName})

Identify the exact local government department or authority responsible for fixing this issue in India.
If you are 100% certain of the exact official government complaint email address for this department in this specific pincode/state, provide it. Otherwise, generate a highly targeted web search query to find their official complaint email address.

Respond ONLY in valid JSON with these keys:
- departmentName: string (Exact authority name, e.g., Department of Electricity, Municipal Water Board, etc.)
- category: string (Must be exactly one of: electricity, water, roads, sanitation, police, streetlight, telecom, aadhaar, ration, foodsafety, traffic, general)
- officialEmail: string or null (The exact verified email address if you know it, otherwise null)
- searchQuery: string (A precise search query containing the department name, the words "official email address", and the pincode)
`;
  
  try {
    const rawResponse = await callAI(prompt, 1, true);
    const parsed = JSON.parse(rawResponse.match(/\{[\s\S]*\}/)?.[0] || rawResponse);
    return parsed;
  } catch (err) {
    logger.warn(`[AI] analyzeComplaintWithAI failed: ${err.message}`);
    return null; // Fallback to Regex
  }
};

// ─────────────────────────────────────────────────────────
// SMART EMAIL EXTRACTOR (Filters out IT/Webmaster emails)
// ─────────────────────────────────────────────────────────
const extractBestEmail = (rawText) => {
  const matches = rawText.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.(gov\.in|nic\.in)/gi);
  if (!matches) return null;

  const uniqueEmails = [...new Set(matches.map(e => e.toLowerCase()))];
  const badWords = ['it', 'webmaster', 'admin', 'info', 'noreply', 'no-reply', 'support', 'helpdesk', 'postmaster', 'network', 'contact', 'care'];
  const badDomains = ['duckduckgo', 'example', 'brave', 'yahoo', 'ask'];

  // Pass 1: Find a highly specific email (does not contain any bad words in prefix)
  for (const email of uniqueEmails) {
    const prefix = email.split('@')[0];
    const domain = email.split('@')[1];
    
    if (badDomains.some(bd => domain.includes(bd))) continue;

    // Check if the prefix contains any of the bad words (e.g. 'mailhelpdesk' contains 'helpdesk')
    const hasBadWord = badWords.some(bw => prefix.includes(bw));
    if (!hasBadWord) return email; 
  }

  // Pass 2: If only generic emails found, return the first valid one
  for (const email of uniqueEmails) {
    const domain = email.split('@')[1];
    if (!badDomains.some(bd => domain.includes(bd))) return email;
  }
  return null;
};

// ─────────────────────────────────────────────────────────
// DIRECT WEB SEARCH ENGINE (DuckDuckGo Lite - No API Key)
// ─────────────────────────────────────────────────────────
const searchDuckDuckGo = async (searchQuery, fallbackCategory) => {
  try {
    const query = searchQuery;
    const url = `https://lite.duckduckgo.com/lite/`;
    
    const params = new URLSearchParams();
    params.append('q', query);

    const { data } = await axios.post(url, params, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });
    
    const rawText = data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' '); 

    const bestEmail = extractBestEmail(rawText);
    if (bestEmail) return { email: bestEmail, name: `Official ${fallbackCategory} Authority` };

    // Attempt 2: Use Ollama (Truncated to avoid timeout)
    const truncatedText = rawText.substring(0, 3000);
    try {
      const prompt = `Here is scraped web search text for finding a complaint email for query: "${searchQuery}":\n${truncatedText}\n\nIdentify the exact official department/company name and their complaint email address. Respond ONLY in valid JSON with keys: 'departmentName' (string) and 'email' (string, or null if not found).`;
      
      const rawResponse = await callAI(prompt, 1);
      const result = JSON.parse(rawResponse);
      if (result.email && result.email.includes('@') && !result.email.includes('duckduckgo')) {
        return {
          email: result.email.toLowerCase(),
          name: result.departmentName || `Official ${fallbackCategory} Authority`
        };
      }
    } catch (ollamaErr) {
      logger.warn(`[AI] Gemini not available for DuckDuckGo parsing.`);
    }

    return null;
  } catch (err) {
    logger.error(`[AI] DuckDuckGo Search failed:`, err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────
// GOOGLE CUSTOM SEARCH ENGINE (Dynamic Email Discovery)
// ─────────────────────────────────────────────────────────
const searchGoogleForEmail = async (searchQuery, fallbackCategory) => {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  
  if (!apiKey || !cx || apiKey.startsWith('AQ.')) return null;

  try {
    const query = searchQuery;
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}&num=5`;
    const { data } = await axios.get(url, { timeout: 10000 });
    
    if (data.items && data.items.length > 0) {
      const snippets = data.items.map(i => i.title + ': ' + i.snippet).join('\n');
      
      try {
        const prompt = `Here are Google search results for finding a complaint email for query: "${searchQuery}":\n${snippets}\n\nIdentify the exact official department/company name and their complaint email address. Respond ONLY in valid JSON with keys: 'departmentName' (string) and 'email' (string, or null if not found).`;
        
        const rawResponse = await callAI(prompt, 1);
        const result = JSON.parse(rawResponse);
        if (result.email && result.email.includes('@')) {
          return {
            email: result.email.toLowerCase(),
            name: result.departmentName || `Official ${fallbackCategory} Authority`
          };
        }
      } catch (e) {
        logger.warn(`[AI] Gemini not available for Google CSE parsing.`);
      }
    }
    return null;
  } catch (err) {
    logger.error(`[AI] Google Search failed:`, err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────
// DIRECT WEB SEARCH ENGINE (Brave Search - No API Key)
// ─────────────────────────────────────────────────────────
const searchBraveForEmail = async (searchQuery, fallbackCategory) => {
  try {
    const query = searchQuery;
    const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000
    });
    
    const rawText = data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' '); 
    const bestEmail = extractBestEmail(rawText);
    if (bestEmail) return { email: bestEmail, name: `Official ${fallbackCategory} Authority` };

    const truncatedText = rawText.substring(0, 3000);
    try {
      const prompt = `Here is scraped web search text for finding a complaint email for query: "${searchQuery}":\n${truncatedText}\n\nIdentify the exact official department/company name and their complaint email address. Respond ONLY in valid JSON with keys: 'departmentName' (string) and 'email' (string, or null if not found).`;
      
      const rawResponse = await callAI(prompt, 1);
      const result = JSON.parse(rawResponse);
      if (result.email && result.email.includes('@') && !result.email.includes('duckduckgo') && !result.email.includes('brave')) {
        return {
          email: result.email.toLowerCase(),
          name: result.departmentName || `Official ${fallbackCategory} Authority`
        };
      }
    } catch (ollamaErr) {
      logger.warn(`[AI] Gemini not available for Brave Search parsing.`);
    }

    return null;
  } catch (err) {
    logger.error(`[AI] Brave Search failed:`, err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────
// DIRECT WEB SEARCH ENGINE (Yahoo Search)
// ─────────────────────────────────────────────────────────
const searchYahoo = async (searchQuery, fallbackCategory) => {
  try {
    const query = searchQuery;
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    const rawText = data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' '); 
    const bestEmail = extractBestEmail(rawText);
    if (bestEmail) return { email: bestEmail, name: `Official ${fallbackCategory} Authority` };
    return null;
  } catch (err) {
    logger.error(`[AI] Yahoo Search failed:`, err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────
// DIRECT WEB SEARCH ENGINE (Ask.com)
// ─────────────────────────────────────────────────────────
const searchAsk = async (searchQuery, fallbackCategory) => {
  try {
    const query = searchQuery;
    const url = `https://www.ask.com/web?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    const rawText = data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' '); 
    const bestEmail = extractBestEmail(rawText);
    if (bestEmail) return { email: bestEmail, name: `Official ${fallbackCategory} Authority` };
    return null;
  } catch (err) {
    logger.error(`[AI] Ask.com Search failed:`, err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────
// MAIN CLASSIFY FUNCTION
// ─────────────────────────────────────────────────────────
const classifyComplaint = async (rawText, pinCode, user, selectedAddress) => {
  const MAX_RETRIES = 2;
  const stateName = getStateFromPincode(pinCode);

  let category = 'general';
  let department = 'General Grievance';
  let deptName = 'General Grievance Authority';
  let officialEmail = null;
  let dynamicSearchQuery = null;

  // 1. DYNAMIC AI PRE-CLASSIFICATION (The Brains)
  logger.info(`[AI] Dynamically analyzing complaint to determine authority and email...`);
  const analysis = await analyzeComplaintWithAI(rawText, pinCode, stateName);
  
  if (analysis) {
    logger.info(`[AI] AI Analysis Success: ${JSON.stringify(analysis)}`);
    category = analysis.category.toLowerCase();
    department = analysis.departmentName;
    deptName = analysis.departmentName;
    dynamicSearchQuery = analysis.searchQuery;
    
    const pinStr = String(pinCode);
    const prefixesToTry = [
      pinStr,                   // 6-digit (Exact Pin)
      pinStr.substring(0, 4),   // 4-digit (Sub-region)
      pinStr.substring(0, 3),   // 3-digit (Hyper-Local City, e.g. '400' Mumbai)
      pinStr.substring(0, 2)    // 2-digit (State Fallback, e.g. '40' Maharashtra)
    ];

    // 1. MEGA-FAST PATH: Longest Prefix Match (Smart Regional DB)
    let cacheEntry = null;
    try {
      for (const prefix of prefixesToTry) {
        if (!prefix || prefix.length < 2) continue;
        cacheEntry = await DepartmentEmailCache.findOne({ regionPrefix: prefix, category });
        if (cacheEntry) {
          officialEmail = cacheEntry.officialEmail;
          logger.info(`[AI] HYPER-LOCAL MATCH: Found email for Prefix ${prefix}! ${officialEmail} (Source: ${cacheEntry.source})`);
          break; // Stop at the most specific match
        }
      }
    } catch (e) {
      logger.error(`[AI] Cache lookup error: ${e.message}`);
    }

    // 2. ABSOLUTE FAST PATH: VERIFIED_EMAILS is ground truth. Override AI if we have a hardcoded email.
    if (!officialEmail && VERIFIED_EMAILS[category]) {
      const statePrefix = pinStr.substring(0, 2);
      const verified = VERIFIED_EMAILS[category][statePrefix] || VERIFIED_EMAILS[category]['default'];
      if (verified) {
        officialEmail = verified;
        logger.info(`[AI] SUPER-FAST PATH: Overrode AI with 100% verified hardcoded email: ${officialEmail}`);
      }
    }

    // 2. AI provided the exact official email directly! (And we didn't have a hardcoded one)
    if (!officialEmail && analysis.officialEmail && analysis.officialEmail.includes('@') && !analysis.officialEmail.includes('duckduckgo')) {
      const cleanedEmail = analysis.officialEmail.toLowerCase().trim();
      // Ensure the AI didn't hallucinate a generic/fake email (like jsmith@, info@)
      const isValid = extractBestEmail(cleanedEmail); 
      // extractBestEmail returns the email if it doesn't have bad words, otherwise null. 
      // But we must also ensure it's not a generic fake name like jsmith, doe, dummy.
      if (isValid && !cleanedEmail.match(/jsmith|doe|dummy|test|example/)) {
        officialEmail = cleanedEmail;
        logger.info(`[AI] AI already knew the exact official email: ${officialEmail}`);
      } else {
        logger.warn(`[AI] Rejected AI hallucinated/fake email: ${cleanedEmail}`);
      }
    }
  } else {
    // FALLBACK TO REGEX IF AI ANALYSIS FAILED
    logger.warn(`[AI] Falling back to Regex Resolver`);
    const resolved = resolveOfficialEmail(rawText, pinCode || '110001');
    category = resolved.category;
    department = CATEGORY_LABELS[category] || 'General Grievance';
    deptName = resolved.name;
    officialEmail = resolved.verifiedEmail || null;
  }

  // 2. Try to find the exact official email dynamically
  const fallbackSearchQuery = `${department} complaint official email address provider for ${stateName} pincode ${pinCode} India`;
  const finalSearchQuery = dynamicSearchQuery || fallbackSearchQuery;

  // MASTER LOOP OF 5 SEARCH ENGINES TO BYPASS RATE LIMITS (Only if not verified in hardcoded dictionary)
  const searchEngines = officialEmail ? [] : [
    { name: 'Google CSE', func: () => searchGoogleForEmail(finalSearchQuery, department) },
    { name: 'Brave Search', func: () => searchBraveForEmail(finalSearchQuery, department) },
    { name: 'Yahoo Search', func: () => searchYahoo(finalSearchQuery, department) },
    { name: 'DuckDuckGo', func: () => searchDuckDuckGo(finalSearchQuery, department) },
    { name: 'Ask.com', func: () => searchAsk(finalSearchQuery, department) }
  ];

  for (const engine of searchEngines) {
    if (officialEmail) break;
    
    // Skip Google if invalid API key
    if (engine.name === 'Google CSE' && (!process.env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_CSE_API_KEY.startsWith('AQ.'))) {
      continue;
    }

    logger.info(`[AI] Searching ${engine.name} for exact ${department} authority in pincode ${pinCode}...`);
    const result = await engine.func();
    if (result && result.email) {
      officialEmail = result.email;
      deptName = result.name;
      logger.info(`[AI] ${engine.name} found dynamic exact authority: ${deptName} (${officialEmail})`);
    }
  }

  // 3. User Requested Validation: If email STILL not found, reject submission.
  if (!officialEmail) {
    logger.warn(`[AI] Could not find a valid email for ${department} in pincode ${pinCode}`);
    throw new Error('Humein aapki problem ke hisaab se sahi department ka email nahi mil raha. Kripya apni problem ko aur acche se aur sahi spelling ke sath dobara likhein.');
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const prompt     = buildClassifyPrompt(rawText, pinCode, deptName, selectedAddress);
      const rawResponse = await callAI(prompt, attempt);

      let parsed;
      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        const match = rawResponse.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('AI returned invalid JSON');
      }

      // Sender info
      const senderName  = user?.name  || 'Concerned Citizen';
      const senderEmail = user?.email || 'Not Provided';

      // Safe extraction of AI fields
      const summary  = (parsed.summary && typeof parsed.summary === 'string') ? parsed.summary : 'An issue has been reported requiring urgent attention.';
      const aiBody   = (parsed.body    && typeof parsed.body    === 'string' && parsed.body.length > 20)
        ? parsed.body
        : `We are writing to bring to your urgent attention a serious issue in our area (Pincode: ${pinCode}).\n\n${summary}\n\n[Original citizen remark: "${rawText}"]`;

      const subject  = (parsed.subject && typeof parsed.subject === 'string' && parsed.subject.length > 5)
        ? parsed.subject
        : `Complaint Regarding ${department} Issue in Pincode ${pinCode}`;

      // Final email — structured by us, AI only fills subject + body
      const finalFormalEmail =
`From: ${senderEmail}
To: ${officialEmail}

Subject: ${subject}

Dear Sir/Madam,

${aiBody}

We kindly request you to look into this matter urgently and take necessary action at the earliest. The residents of this area are facing immense hardship due to this issue.

Thank you for your time and attention.

Sincerely,
${senderName}`;

      return {
        department,
        deptName,
        formalEmail: finalFormalEmail,
        summary,
        confidence: parsed.confidence || 0.85,
        officialEmail,
      };

    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      logger.info(`[AI] Retrying... attempt ${attempt + 1}`);
      await new Promise(r => setTimeout(r, 1500));
    }
  }
};

const draftEscalationEmail = async (complaint) => {
  const prompt = `Draft a strict, formal escalation email for the following unresolved government complaint.
Issue: ${complaint.description?.raw || 'Unspecified issue'}
Department: ${complaint.department}
It has been pending for over 7 days with no response.
Write ONLY the email body text in professional English. No JSON.`;

  try {
    const responseText = await callAI(prompt);
    return responseText;
  } catch {
    throw new Error('AI service temporarily unavailable');
  }
};

module.exports = { classifyComplaint, draftEscalationEmail, callAI };
