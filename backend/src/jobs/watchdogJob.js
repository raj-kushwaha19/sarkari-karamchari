const cron = require('node-cron');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Representative = require('../models/Representative');
const { sendComplaintEmail } = require('../utils/mailer');
const { callAI } = require('../services/aiService');
const logger = require('../utils/logger');

// ──────────────────────────────────────────────────────────────────────────────
// THRESHOLDS
// ──────────────────────────────────────────────────────────────────────────────
const DAY                  = 24 * 60 * 60 * 1000;
const LEVEL1_FOLLOWUP_AFTER = 4 * DAY;   // Day 4 → Ask user, then re-send to same dept
const LEVEL2_ESCALATE_AFTER = 9 * DAY;   // Day 9 (4+5) → Escalate to HQ / MLA
const LEVEL3_MINISTRY_AFTER = 14 * DAY;  // Day 14 → Final: Ministry / CM Office

// ──────────────────────────────────────────────────────────────────────────────
// ESCALATION EMAIL MAPS
// ──────────────────────────────────────────────────────────────────────────────
const HQ_EMAILS = {
  electricity: 'grievance@derc.gov.in',
  water:       'ceo@delhijalboard.gov.in',
  roads:       'secy.pwd@nic.in',
  sanitation:  'commissioner@mcdonline.nic.in',
  police:      'cp.delhi@delhipolice.gov.in',
  traffic:     'cp.delhi@delhipolice.gov.in',
  health:      'dghs@nic.in',
  general:     'pgportal@gov.in',
};

const MINISTRY_EMAILS = {
  electricity: 'secy.power@nic.in',
  water:       'secy.urban@nic.in',
  roads:       'secy.rt@nic.in',
  sanitation:  'secy.urban@nic.in',
  police:      'secy.mha@nic.in',
  traffic:     'secy.mha@nic.in',
  health:      'secy.health@nic.in',
  general:     'pgindia@pgportal.gov.in',
};

const getEscalationEmail = (map, department) => {
  const deptLower = (department || '').toLowerCase();
  const key = Object.keys(map).find(k => deptLower.includes(k));
  return map[key] || map['general'];
};

// Get REAL MLA/MP from DB for this pincode, fallback to hardcoded maps
const getRepresentativeEmail = async (pinCode, type = 'MLA') => {
  try {
    const pinStr = String(pinCode);
    // Try from most specific to least specific prefix
    for (const prefix of [pinStr.substring(0, 4), pinStr.substring(0, 3), pinStr.substring(0, 2)]) {
      const rep = await Representative.findOne({ type, pincode: prefix });
      if (rep && rep.officeEmail) {
        logger.info(`[Watchdog] Found ${type} from DB for pin prefix ${prefix}: ${rep.name} (${rep.officeEmail})`);
        return { email: rep.officeEmail, name: rep.name, district: rep.district };
      }
    }
  } catch (e) {
    logger.error('[Watchdog] Representative DB lookup error:', e.message);
  }
  return null;
};

// ──────────────────────────────────────────────────────────────────────────────
// IMAP REPLY CHECKER
// Connects to Gmail inbox and checks if a reply was received for a complaint
// ──────────────────────────────────────────────────────────────────────────────
const checkForReply = (complaintId, department) => {
  return new Promise((resolve) => {
    const imapConfig = {
      user: process.env.GMAIL_USER,
      password: process.env.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    };

    if (!imapConfig.user || !imapConfig.password) {
      logger.warn('[IMAP] Gmail credentials not set, skipping reply check.');
      return resolve(false);
    }

    const imap = new Imap(imapConfig);
    let replyFound = false;

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          logger.error('[IMAP] Could not open inbox:', err.message);
          imap.end();
          return resolve(false);
        }

        // Search for emails from government domains mentioning the complaint ID
        const searchCriteria = [
          'UNSEEN',
          ['SINCE', new Date(Date.now() - 30 * DAY)],
          ['OR',
            ['TEXT', complaintId.toString()],
            ['SUBJECT', department]
          ]
        ];

        imap.search(searchCriteria, (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return resolve(false);
          }

          logger.info(`[IMAP] Found ${results.length} potential reply email(s) for complaint ${complaintId}`);

          const fetch = imap.fetch(results.slice(-5), { bodies: 'HEADER.FIELDS (FROM SUBJECT)', struct: true });
          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;
                const from = (parsed.from?.text || '').toLowerCase();
                const subject = (parsed.subject || '').toLowerCase();
                const deptLower = (department || '').toLowerCase();

                // Check if it's from an official .gov.in domain or mentions the dept
                if (from.includes('.gov.in') || from.includes('.nic.in') ||
                    subject.includes(complaintId.toString()) ||
                    subject.includes(deptLower)) {
                  logger.info(`[IMAP] ✅ Reply found from: ${from} for complaint ${complaintId}`);
                  replyFound = true;
                }
              });
            });
          });

          fetch.once('end', () => {
            setTimeout(() => {
              imap.end();
              resolve(replyFound);
            }, 2000);
          });
        });
      });
    });

    imap.once('error', (err) => {
      logger.error('[IMAP] Connection error:', err.message);
      resolve(false);
    });

    imap.once('end', () => {
      resolve(replyFound);
    });

    imap.connect();
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// EMAIL BUILDERS
// ──────────────────────────────────────────────────────────────────────────────
// AI-powered professional follow-up email generator
const buildFollowUpEmail = async (complaint, user) => {
  const daysOld   = Math.max(1, Math.round((Date.now() - new Date(complaint.createdAt).getTime()) / DAY));
  const address   = complaint.location.exactAddress || `Pincode: ${complaint.location.pinCode}`;
  const rawIssue  = complaint.description.raw || '';
  const deptEmail = complaint.officialEmail || 'public.grievance@delhi.gov.in';

  const subject = `[FOLLOW-UP] Ref: ${complaint.complaintCode || complaint._id} | ${complaint.department} | ${daysOld} Days — No Response`;

  let body = '';
  try {
    const aiPrompt =
`You are a senior Indian government complaint follow-up letter writer.

A citizen filed this civic complaint (may be in Hindi/Hinglish/English):
"${rawIssue}"

Complaint Details:
- Department: ${complaint.department}
- Complaint Reference ID: ${complaint.complaintCode || complaint._id}
- Pincode: ${complaint.location.pinCode}
- Exact Address / Location: ${address}
- Complaint Filed: ${daysOld} day(s) ago with NO response
- Citizen Name: ${user.name}
- Citizen Email: ${user.email}

Write a STRICT, FORMAL, PROFESSIONAL follow-up letter in English to the department.
Rules:
1. Start with: "Dear Sir/Madam,"
2. State the original complaint issue in formal English — include the EXACT address/location.
3. Mention that ${daysOld} days have passed with zero response.
4. Demand immediate action.
5. Warn that non-compliance within 5 working days will result in escalation to the District Collector, MLA, and the concerned Ministry.
6. Sign off: Citizen name, email, "via Sarkari Karamchari AI Civic Platform".
7. Output ONLY the letter body — no Subject line, no JSON, no markdown.`;

    body = await callAI(aiPrompt);
  } catch (aiErr) {
    logger.warn('[Watchdog] AI follow-up generation failed, using fallback template:', aiErr.message);
  }

  // Fallback template if AI fails
  if (!body || body.length < 50) {
    body =
`Dear Sir/Madam,

I am writing to formally follow up on the civic complaint filed ${daysOld} day(s) ago regarding an issue at the following location: ${address}.

Original Complaint:
"${rawIssue}"

Despite ${daysOld} day(s) having elapsed since the complaint was registered, we have received no acknowledgement or action from your department. This unresolved issue continues to cause significant inconvenience to the citizens of this area.

We hereby request you to take immediate cognizance of this matter and initiate corrective action at the earliest. Please be informed that if this complaint is not addressed within the next 5 working days, it will be escalated to the District Collector, the concerned MLA, and the Ministry.

Yours sincerely,
${user.name}
${user.email}
Filed via Sarkari Karamchari AI Civic Platform`;
  }

  const fullBody = `Complaint Reference ID: ${complaint.complaintCode || complaint._id}\nDepartment: ${complaint.department}\nPincode: ${complaint.location.pinCode}\nLocation: ${address}\n\n${body}`;

  return { subject, body: fullBody, deptEmail };
};

const buildHQEmail = (complaint, user, hqEmail) => ({
  subject: `[ESCALATION] No Action by Dept – ${complaint.department} | PIN: ${complaint.location.pinCode} | Ref: ${complaint.complaintCode}`,
  body:
`From: ${user.email}
To: ${hqEmail}

Subject: [ESCALATION] No Action Taken by ${complaint.department}

Respected Sir/Madam,

We are escalating this complaint to your esteemed office as the concerned department (${complaint.department}) has failed to respond or take any action despite a follow-up, over the past 9 days.

Complaint Reference ID: ${complaint.complaintCode}
Department: ${complaint.department}
Pincode: ${complaint.location.pinCode}
Location: ${complaint.location.exactAddress || 'Not specified'}

Original Complaint:
"${complaint.description.raw}"

We urgently request your personal intervention so that this matter is resolved immediately. The citizens of Pincode ${complaint.location.pinCode} are facing immense hardship due to this unresolved issue.

Yours sincerely,
${user.name}
${user.email}
Filed via Sarkari Karamchari`,
});

const buildMinistryEmail = (complaint, user, ministryEmail) => ({
  subject: `[URGENT ESCALATION] 14 Days – No Resolution – ${complaint.department} | PIN: ${complaint.location.pinCode} | Ref: ${complaint.complaintCode}`,
  body:
`From: ${user.email}
To: ${ministryEmail}

Subject: [URGENT ESCALATION] 14 Days of No Resolution – ${complaint.department}

Respected Sir/Madam,

Despite filing a complaint and sending multiple follow-ups over the past 14 days, NO action has been taken by the ${complaint.department} or any senior authority. We are now compelled to escalate this to the highest level.

Complaint Reference ID: ${complaint.complaintCode}
Department: ${complaint.department}
Pincode: ${complaint.location.pinCode}
Location: ${complaint.location.exactAddress || 'Not specified'}

Timeline of actions taken:
${(complaint.timeline || []).map(t => `- [${new Date(t.timestamp).toLocaleDateString('en-IN')}] ${t.note}`).join('\n')}

Original Complaint:
"${complaint.description.raw}"

We humbly request your immediate personal intervention. The citizens of this area deserve a timely resolution.

Yours respectfully,
${user.name}
${user.email}
Filed via Sarkari Karamchari`,
});

// ──────────────────────────────────────────────────────────────────────────────
// USER NOTIFICATION EMAIL
// ──────────────────────────────────────────────────────────────────────────────
const notifyUser = async (user, complaint, message, subjectLine) => {
  await sendComplaintEmail(user.email, subjectLine,
`Dear ${user.name},

${message}

Complaint Details:
- Department: ${complaint.department}
- Pincode: ${complaint.location.pinCode}
- Complaint ID: ${complaint._id}

You can view the full status and timeline at: ${process.env.FRONTEND_URL || 'https://sarkari-karamchari.vercel.app'}/complaint/${complaint._id}

Regards,
Sarkari Karamchari AI System`
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// MAIN WATCHDOG LOGIC
// ──────────────────────────────────────────────────────────────────────────────
const runWatchdog = async () => {
  logger.info('👁️ [Watchdog] Running smart tracking check...');
  
  try {
    const now = Date.now();

    // Fetch all active (unresolved) complaints
    const complaints = await Complaint.find({
      status: { $nin: ['resolved', 'rejected'] },
    });

    logger.info(`👁️ [Watchdog] Processing ${complaints.length} active complaint(s)...`);

    for (const complaint of complaints) {
      try {
        const user = await User.findById(complaint.userRef).select('name email');
        if (!user) continue;

        const age = now - new Date(complaint.createdAt).getTime();
        let changed = false;

        // ── STEP 1: After 4 days → Check for reply, if none → ask user & send follow-up ──
        if (age >= LEVEL1_FOLLOWUP_AFTER && complaint.escalationLevel < 1) {
          
          logger.info(`[Watchdog] Complaint ${complaint._id} is 4+ days old. Checking for department reply...`);
          const gotReply = await checkForReply(complaint._id, complaint.department);
          
          if (gotReply) {
            // Reply received! Mark as resolved, notify user
            logger.info(`[Watchdog] ✅ Reply FOUND for ${complaint._id}. Notifying user to confirm resolution.`);
            complaint.status = 'department_received';
            complaint.userActionRequired = 'needs_followup'; // Ask user to mark resolved
            complaint.timeline.push({ stage: 'department_received', timestamp: new Date(), note: '📬 Department sent a reply! Please check your email and mark this as resolved if satisfied.' });
            complaint.notifications.push({ message: '📬 Good news! It looks like the department has replied to your complaint. Please check your email and mark this complaint as Resolved if your issue is fixed.', type: 'success' });
            
            await notifyUser(user, complaint,
              '📬 We detected a reply from the department regarding your complaint! Please check your registered email and if the issue is resolved, click "Mark as Resolved" in the app.',
              `[Reply Detected] ${complaint.department} responded to your complaint`
            );

          } else {
            // No reply → Send AI-written follow-up email to department AND notify user
            logger.info(`[Watchdog] ❌ No reply for ${complaint._id}. Generating AI follow-up email...`);

            const { subject, body, deptEmail } = await buildFollowUpEmail(complaint, user);
            await sendComplaintEmail(deptEmail, subject, body, user.email, complaint.complaintCode);

            complaint.escalationLevel = 1;
            complaint.followUpSentAt = new Date();
            complaint.timeline.push({ stage: 'department_received', timestamp: new Date(), note: `No reply in 4 days. AI auto-sent a strict follow-up email to department (${deptEmail}).` });
            complaint.notifications.push({ message: `Four days passed with no department reply! AI has automatically sent a strict follow-up email to ${complaint.department}. If still no reply in 5 more days, your complaint will be auto-escalated to the Head of Department.`, type: 'warning' });

            await notifyUser(user, complaint,
              'Your complaint has received no response in 4 days. We have automatically sent a strict follow-up email to the concerned department on your behalf.',
              `[Follow-Up Sent] No response from ${complaint.department} in 4 days`
            );
          }
          changed = true;

        // ── STEP 2: After 9 days → Escalate to HQ/MLA ──
        } else if (age >= LEVEL2_ESCALATE_AFTER && complaint.escalationLevel < 2) {

          logger.info(`[Watchdog] Complaint ${complaint._id} is 9+ days old. Checking for reply before HQ escalation...`);
          const gotReply = await checkForReply(complaint._id, complaint.department);

          if (!gotReply) {
            const hqEmail = getEscalationEmail(HQ_EMAILS, complaint.department);
            const { subject, body } = buildHQEmail(complaint, user, hqEmail);
            await sendComplaintEmail(hqEmail, subject, body, user.email, complaint.complaintCode);

            complaint.escalationLevel = 2;
            complaint.status = 'hq_escalated';
            complaint.escalatedAt = new Date();
            complaint.timeline.push({ stage: 'hq_escalated', timestamp: new Date(), note: `AI auto-escalated to HQ / MLA (${hqEmail}) after 9 days of no action.` });
            complaint.notifications.push({ message: `Nine days of silence from the department! AI has now escalated your complaint directly to the Head of Department / MLA (${hqEmail}). They are legally bound to act.`, type: 'warning' });

            await notifyUser(user, complaint,
              `After 9 days of no response from ${complaint.department}, we have escalated your complaint to the Head of Department / MLA (${hqEmail}). They are legally obligated to respond.`,
              `[ESCALATED] Your complaint has been escalated to HQ/MLA`
            );

            changed = true;
            logger.info(`[Watchdog] HQ escalation for complaint ${complaint._id}`);
          } else {
            // Reply came between day 4-9! Update status.
            complaint.status = 'department_received';
            complaint.userActionRequired = 'needs_followup';
            complaint.notifications.push({ message: 'Department replied! Mark this as Resolved if your issue is fixed.', type: 'success' });
            changed = true;
          }

        // ── STEP 3: After 14 days → Final: Ministry / CM Office ──
        } else if (age >= LEVEL3_MINISTRY_AFTER && complaint.escalationLevel < 3) {

                    const ministryEmail = getEscalationEmail(MINISTRY_EMAILS, complaint.department);
          const { subject, body } = buildMinistryEmail(complaint, user, ministryEmail);
          await sendComplaintEmail(ministryEmail, subject, body, user.email, complaint.complaintCode);

          complaint.escalationLevel = 3;
          complaint.status = 'hq_escalated';
          complaint.escalatedAt = new Date();
          complaint.timeline.push({ stage: 'hq_escalated', timestamp: new Date(), note: `FINAL ESCALATION: AI sent complaint to Ministry/CM Office (${ministryEmail}) after 14 days of zero action.` });
          complaint.notifications.push({ message: `14 days of ZERO action! This is unacceptable. AI has now sent your complaint directly to the Ministry / CM Office (${ministryEmail}). This is the highest authority and they must act.`, type: 'danger' });

          await notifyUser(user, complaint,
            `FINAL ESCALATION: After 14 days of zero response, your complaint has been sent directly to the Ministry / CM Office (${ministryEmail}). This is the highest level of escalation possible.`,
            `[FINAL ESCALATION] Complaint sent to Ministry/CM Office`
          );

          changed = true;
          logger.info(`[Watchdog] 🚨 Level-3 Ministry escalation for complaint ${complaint._id}`);
        }

        if (changed) {
          complaint.lastUpdatedAt = new Date();
          await complaint.save();
        }

      } catch (err) {
        logger.error(`[Watchdog] Error processing complaint ${complaint._id}:`, err.message);
      }
    }

    logger.info('👁️ [Watchdog] Smart tracking check complete.');
  } catch (err) {
    logger.error('[Watchdog] Fatal error:', err);
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// SCHEDULE: Every 6 hours
// ──────────────────────────────────────────────────────────────────────────────
const startWatchdogJob = () => {
  cron.schedule('0 */6 * * *', runWatchdog, {
    timezone: 'Asia/Kolkata',
  });
  logger.info('👁️ [Watchdog] Scheduled: every 6 hours IST | 3-Stage Smart Tracking Active');
};

module.exports = { startWatchdogJob, runWatchdog };
