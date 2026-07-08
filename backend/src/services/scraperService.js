const axios = require('axios');
const cheerio = require('cheerio');
const Representative = require('../models/Representative');
const ScrapeLogs = require('../models/ScrapeLogs');
const { sendAdminNotification } = require('./emailService');
const logger = require('../utils/logger');

const HEADERS = {
  'User-Agent': 'SarkariKaramchari-DataRefresh/1.0 (civic-platform; contact: admin@genz-solutions.in)',
  'Accept': 'text/html,application/xhtml+xml',
};

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const upsertRepresentative = async (data) => {
  const existing = await Representative.findOne({
    name: { $regex: new RegExp('^' + data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
    constituency: { $regex: new RegExp('^' + data.constituency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
  });
  
  if (!existing) {
    // New record — create as pending
    await Representative.create({ ...data, approvalStatus: 'pending', lastVerifiedAt: new Date() });
    return 'created';
  }
  
  // Check if data changed
  const changed = existing.name !== data.name || existing.email !== data.email || existing.phone !== data.phone;
  if (changed) {
    existing.name = data.name;
    existing.constituency = data.constituency;
    if (data.email) existing.email = data.email;
    if (data.phone) existing.phone = data.phone;
    existing.approvalStatus = 'pending'; // Requires re-approval after change
    existing.lastVerifiedAt = new Date();
    existing.sourceUrl = data.sourceUrl;
    await existing.save();
    return 'updated';
  }
  
  // No change — just update lastVerifiedAt
  existing.lastVerifiedAt = new Date();
  await existing.save();
  return 'unchanged';
};

const scrapeLokSabha = async () => {
  const url = 'https://sansad.in/ls/members';
  logger.info(`[Scraper] Fetching Lok Sabha members from ${url}`);
  
  let recordsFound = 0;
  let recordsChanged = 0;
  
  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 30000 });
    await sleep(2000); // Respectful delay
    
    const $ = cheerio.load(response.data);
    const members = [];
    
    // Try multiple selectors since site structure can vary
    $('table tbody tr, .member-list .member-item, [class*="member"]').each((i, el) => {
      const cells = $(el).find('td, .member-name, .name');
      const nameEl = cells.first();
      const constituencyEl = cells.eq(1);
      
      const name = nameEl.text().trim();
      const constituency = constituencyEl.text().trim();
      
      if (name && name.length > 2 && constituency && constituency.length > 2) {
        members.push({ name, constituency });
      }
    });
    
    // Fallback: look for any elements with member-like patterns
    if (members.length === 0) {
      $('[class*="member"], [class*="Member"]').each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 5) {
          // Try to parse name and constituency from combined text
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
          if (lines.length >= 2) {
            members.push({ name: lines[0], constituency: lines[1] });
          }
        }
      });
    }
    
    recordsFound = members.length;
    logger.info(`[Scraper] LokSabha: found ${members.length} member records`);
    
    for (const member of members) {
      const result = await upsertRepresentative({
        name: member.name,
        constituency: member.constituency,
        sourceUrl: url,
      });
      if (result === 'created' || result === 'updated') recordsChanged++;
      await sleep(100); // Small delay between DB ops
    }
    
    return { source: 'LokSabha', found: recordsFound, changed: recordsChanged };
    
  } catch (err) {
    logger.error('[Scraper] LokSabha scrape failed:', err.message);
    throw err;
  }
};

const scrapeStateAssemblies = async () => {
  const sources = [
    { state: 'Bihar', url: 'http://vidhansabha.bih.nic.in/Members.aspx' },
    { state: 'Uttar Pradesh', url: 'https://www.upvidhansabha.nic.in/' },
    { state: 'Delhi', url: 'http://www.delhiassembly.nic.in/members.aspx' },
  ];
  
  let totalFound = 0;
  let totalChanged = 0;
  
  for (const source of sources) {
    try {
      logger.info(`[Scraper] Fetching ${source.state} assembly from ${source.url}`);
      await sleep(2000); // Respectful delay between sources
      
      const response = await axios.get(source.url, { headers: HEADERS, timeout: 30000 });
      const $ = cheerio.load(response.data);
      
      const members = [];
      
      $('table tbody tr').each((i, el) => {
        const cells = $(el).find('td');
        const name = cells.first().text().trim();
        const constituency = cells.eq(1).text().trim();
        if (name && name.length > 2 && constituency) {
          members.push({ name, constituency: `${constituency}, ${source.state}` });
        }
      });
      
      totalFound += members.length;
      logger.info(`[Scraper] ${source.state}: found ${members.length} members`);
      
      for (const member of members) {
        const result = await upsertRepresentative({
          name: member.name,
          constituency: member.constituency,
          sourceUrl: source.url,
        });
        if (result === 'created' || result === 'updated') totalChanged++;
        await sleep(100);
      }
      
    } catch (err) {
      // One state failing should NOT stop others
      logger.error(`[Scraper] ${source.state} assembly scrape failed:`, err.message);
    }
  }
  
  return { source: 'StateAssemblies', found: totalFound, changed: totalChanged };
};

const scrapePRS = async () => {
  const url = 'https://prsindia.org/mptrack';
  logger.info(`[Scraper] Fetching PRS data from ${url}`);
  
  try {
    await sleep(2000);
    const response = await axios.get(url, { headers: HEADERS, timeout: 30000 });
    const $ = cheerio.load(response.data);
    
    const members = [];
    
    // PRS has MP attendance data in tables
    $('table tbody tr, .mp-row').each((i, el) => {
      const cells = $(el).find('td');
      const name = cells.first().text().trim();
      const constituency = cells.eq(2).text().trim() || cells.eq(1).text().trim();
      
      if (name && name.length > 2) {
        members.push({ name, constituency: constituency || 'Unknown' });
      }
    });
    
    let changed = 0;
    for (const member of members) {
      const result = await upsertRepresentative({
        name: member.name,
        constituency: member.constituency,
        sourceUrl: url,
      });
      if (result === 'created' || result === 'updated') changed++;
      await sleep(100);
    }
    
    return { source: 'PRS', found: members.length, changed };
  } catch (err) {
    logger.error('[Scraper] PRS scrape failed:', err.message);
    throw err;
  }
};

const runFullScrape = async () => {
  logger.info('[Scraper] ▶ Starting full data refresh scrape');
  const summary = { sources: [], totalFound: 0, totalChanged: 0, errors: [] };
  
  const sources = [
    { name: 'LokSabha', fn: scrapeLokSabha, url: 'https://sansad.in/ls/members' },
    { name: 'StateAssemblies', fn: scrapeStateAssemblies, url: 'Multiple state assembly sites' },
    { name: 'PRS', fn: scrapePRS, url: 'https://prsindia.org/mptrack' },
  ];
  
  for (const source of sources) {
    try {
      const result = await source.fn();
      summary.totalFound += result.found;
      summary.totalChanged += result.changed;
      summary.sources.push(result);
      
      // Log to ScrapeLogs collection
      await ScrapeLogs.create({
        source: source.name,
        url: source.url,
        timestamp: new Date(),
        recordsFound: result.found,
        recordsChanged: result.changed,
        status: 'success',
      });
      
    } catch (err) {
      summary.errors.push({ source: source.name, error: err.message });
      
      await ScrapeLogs.create({
        source: source.name,
        url: source.url,
        timestamp: new Date(),
        recordsFound: 0,
        recordsChanged: 0,
        status: 'error',
        errorMessage: err.message,
      });
    }
  }
  
  // Notify admin if any records changed
  if (summary.totalChanged > 0) {
    await sendAdminNotification(summary.totalChanged);
    logger.info(`[Scraper] Admin notified: ${summary.totalChanged} records changed`);
  }
  
  logger.info('[Scraper] ✅ Full scrape complete:', summary);
  return summary;
};

module.exports = { runFullScrape, scrapeLokSabha, scrapeStateAssemblies, scrapePRS };
