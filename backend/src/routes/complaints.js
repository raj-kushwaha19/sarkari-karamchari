const express = require('express');
const verifyJWT = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const Complaint = require('../models/Complaint');
const Representative = require('../models/Representative');
const { complaintSchema, validate } = require('../utils/validators');
const { sanitizeComplaint } = require('../utils/sanitize');
const logger = require('../utils/logger');
const { sendComplaintEmail } = require('../utils/mailer');
const User = require('../models/User');
const { callAI } = require('../services/aiService');

const router = express.Router();

// All routes require auth
router.use(verifyJWT);

// GET /api/complaints - list user's complaints
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find({ userRef: req.user.id })
      .sort({ lastUpdatedAt: -1 })
      .select('-__v');
    res.json(complaints);
  } catch (err) {
    logger.error('[Complaints] GET / error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/complaints/notifications/read - Mark all notifications as read
router.post('/notifications/read', async (req, res) => {
  try {
    const complaints = await Complaint.find({ userRef: req.user.id, 'notifications.read': false });
    for (const c of complaints) {
      c.notifications.forEach(n => { n.read = true; });
      await c.save();
    }
    res.json({ success: true });
  } catch (err) {
    logger.error('[Complaints] POST /notifications/read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

// POST /api/complaints - create complaint
router.post('/', validate(complaintSchema), async (req, res) => {
  try {
    const sanitized = sanitizeComplaint(req.body);
    const complaint = new Complaint({
      userRef: req.user.id,
      department: sanitized.department,
      location: { pinCode: sanitized.pinCode, exactAddress: sanitized.exactAddress },
      status: 'submitted',
      officialEmail: sanitized.officialEmail || '',
      description: {
        raw: sanitized.description.raw,
        aiFormatted: sanitized.description.aiFormatted || '',
      },
      timeline: [{ stage: 'submitted', timestamp: new Date(), note: 'Complaint filed by citizen' }],
      notifications: [{ message: 'Your complaint has been submitted and emailed to the concerned department.', type: 'success' }],
      lastUpdatedAt: new Date(),
      escalationLevel: 0,
    });

    // Save complaint first to generate unique complaintCode
    await complaint.save();

    // Auto-Dispatch AI Email logic with generated Tracking Code
    const user = await User.findById(req.user.id);
    const aiDraft = sanitized.description.aiFormatted || '';
    
    // Default subject and body with reference code
    let emailSubject = `[Ref: ${complaint.complaintCode}] [URGENT] Civic Issue - PIN: ${sanitized.pinCode}`;
    let emailBody = `Complaint Reference ID: ${complaint.complaintCode}\n\n${aiDraft}`;

    const subjectMatch = aiDraft.match(/Subject:\s*(.*)/i);
    if (subjectMatch) {
      emailSubject = `[Ref: ${complaint.complaintCode}] ${subjectMatch[1].trim()}`;
    }
    
    // The target is the official department email (fallback to our test email if blank)
    const targetEmail = sanitized.officialEmail || 'test@sarkar.com';

    // Send email asynchronously without blocking the HTTP response
    sendComplaintEmail(targetEmail, emailSubject, emailBody, user.email, complaint.complaintCode).then(success => {
      if (success) {
        // Automatically update timeline to show it was sent
        complaint.status = 'department_received';
        complaint.timeline.push({ stage: 'department_received', timestamp: new Date(), note: 'AI successfully forwarded complaint to ' + targetEmail });
        complaint.save().catch(e => logger.error(`[Complaints] Async save error for ${complaint._id}:`, e));
      }
    });

    logger.info(`[Complaints] New complaint created: ${complaint._id} (Code: ${complaint.complaintCode}) by user ${req.user.id}`);
    res.status(201).json(complaint);
  } catch (err) {
    logger.error('[Complaints] POST / error:', err);
    res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
});

// GET /api/complaints/:id - get single complaint
router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).select('-__v');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    // Ownership check
    if (complaint.userRef.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(complaint);
  } catch (err) {
    logger.error('[Complaints] GET /:id error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// PATCH /api/complaints/:id/status - update status (admin only)
router.patch('/:id/status', adminGuard, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['submitted', 'department_received', 'hq_escalated', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status,
        lastUpdatedAt: new Date(),
        $push: { timeline: { stage: status, timestamp: new Date(), note: note || '' } },
      },
      { new: true }
    );

    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    res.json(complaint);
  } catch (err) {
    logger.error('[Complaints] PATCH /:id/status error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/complaints/:id/action - trigger manual action
router.post('/:id/action', async (req, res) => {
  try {
    const { action } = req.body; // 'resolve', 'followup', 'escalate', 'escalate_mla'
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    if (complaint.userRef.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await User.findById(req.user.id);

    if (action === 'resolve') {
      complaint.status = 'resolved';
      complaint.userActionRequired = 'none';
      complaint.timeline.push({ stage: 'resolved', timestamp: new Date(), note: '✅ Resolved by citizen after department reply.' });

    } else if (action === 'followup') {
      const deptEmail = complaint.officialEmail || 'public.grievance@delhi.gov.in';
      const rawIssue = complaint.description.raw || '';
      const address  = complaint.location.exactAddress || `Pincode: ${complaint.location.pinCode}`;
      const daysOld  = Math.max(1, Math.round((Date.now() - new Date(complaint.createdAt)) / 86400000));

      // ── AI-Generated Professional Follow-Up Email ───────────────────────────
      let professionalBody = '';
      try {
        const aiPrompt =
`You are a senior Indian government complaint follow-up letter writer.

A citizen previously filed this civic complaint (may be in Hindi/Hinglish/English):
"${rawIssue}"

Complaint Details:
- Department: ${complaint.department}
- Complaint Reference ID: ${complaint.complaintCode || complaint._id}
- Pincode: ${complaint.location.pinCode}
- Exact Address / Location: ${address}
- Complaint Filed: ${daysOld} day(s) ago
- Citizen Name: ${user.name}
- Citizen Email: ${user.email}

Write a STRICT, FORMAL, PROFESSIONAL follow-up letter in English to the department.
Rules:
1. Address it: "Dear Sir/Madam," 
2. Clearly state the original issue translated into formal English — include the EXACT address/location.
3. Mention that this complaint was filed ${daysOld} days ago with NO response.
4. Demand immediate action.
5. Warn that failure to respond within 5 working days will lead to escalation to MLA / District Collector / Ministry.
6. Sign off as the citizen (name + email + "via Sarkari Karamchari AI Platform").
7. Output ONLY the email body text — no Subject line, no JSON, no markdown.`;

        professionalBody = await callAI(aiPrompt);
      } catch (aiErr) {
        logger.warn('[Complaints] AI follow-up generation failed, using fallback template:', aiErr.message);
      }

      // Fallback to structured template if AI fails
      if (!professionalBody || professionalBody.length < 50) {
        professionalBody =
`Dear Sir/Madam,

I am writing to formally follow up on my complaint that was filed ${daysOld} day(s) ago regarding the following issue at ${address}.

Original Complaint:
"${rawIssue}"

Despite the passage of ${daysOld} day(s), I have received no acknowledgement, response, or resolution from your department. This matter is causing significant inconvenience to the residents of this area.

I request you to take immediate action on this complaint. Please be informed that if this matter is not addressed within the next 5 working days, I will be compelled to escalate this complaint to the District Collector, MLA, and the concerned Ministry.

Yours sincerely,
${user.name}
${user.email}
Filed via Sarkari Karamchari AI Platform`;
      }

      const subject = `[FOLLOW-UP] Ref: ${complaint.complaintCode || complaint._id} | ${complaint.department} | ${daysOld} Days — No Response`;
      const fullBody = `Complaint Reference ID: ${complaint.complaintCode || complaint._id}\nDepartment: ${complaint.department}\nPincode: ${complaint.location.pinCode}\nLocation: ${address}\n\n${professionalBody}`;

      await sendComplaintEmail(deptEmail, subject, fullBody, user.email, complaint.complaintCode);
      complaint.escalationLevel = 1;
      complaint.followUpSentAt = new Date();
      complaint.userActionRequired = 'none';
      complaint.timeline.push({ stage: 'department_received', timestamp: new Date(), note: `📧 AI-written professional follow-up email sent to ${deptEmail} after ${daysOld} days of no response.` });

    } else if (action === 'escalate') {
      // Escalate to HQ (Level 2) — auto handled, just mark
      complaint.escalationLevel = 2;
      complaint.status = 'hq_escalated';
      complaint.userActionRequired = 'none';
      complaint.timeline.push({ stage: 'hq_escalated', timestamp: new Date(), note: '⚠️ User escalated complaint to Head of Department / HQ.' });

    } else if (action === 'escalate_mla') {
      // ── FINAL ESCALATION: Look up the REAL MLA/MP from DB ──
      const pinStr = String(complaint.location.pinCode);
      let rep = null;

      // Try to find MLA first, then MP, using prefix matching
      for (const type of ['MLA', 'MP']) {
        for (const prefix of [pinStr.substring(0, 4), pinStr.substring(0, 3), pinStr.substring(0, 2)]) {
          rep = await Representative.findOne({ type, pincode: prefix });
          if (rep) break;
        }
        if (rep) break;
      }

      const targetEmail = rep?.officeEmail || 'pgportal@gov.in';
      const repName    = rep?.name || 'Honourable MLA / Minister';
      const repType    = rep?.type || 'MLA';
      const district   = rep?.district || complaint.location.pinCode;

      const daysOld = Math.round((Date.now() - new Date(complaint.createdAt)) / 86400000);

      const subject = `[URGENT ESCALATION] ${daysOld} Days – No Action by ${complaint.department} | PIN: ${complaint.location.pinCode}`;
      const body =
`From: ${user.email}
To: ${targetEmail}

Subject: ${subject}

Respected ${repName} (${repType}, ${district}),

I am a citizen of your constituency (Pincode: ${complaint.location.pinCode}) and I am writing to you as a last resort after exhausting all channels.

Despite filing a formal complaint and sending multiple follow-ups over the past ${daysOld} days, the ${complaint.department} department has taken NO action whatsoever.

Complaint Reference ID: ${complaint._id}
Department: ${complaint.department}
Exact Location: ${complaint.location.exactAddress || 'Pincode ' + complaint.location.pinCode}

Issue Description:
"${complaint.description.raw}"

Timeline of Actions Taken:
${(complaint.timeline || []).map(t => `• [${new Date(t.timestamp).toLocaleDateString('en-IN')}] ${t.note}`).join('\n')}

I humbly request your personal intervention. Your constituents deserve timely resolution of civic issues.

Yours respectfully,
${user.name}
${user.email}
(Filed via Sarkari Karamchari — AI Civic Grievance Platform)`;

      await sendComplaintEmail(targetEmail, subject, body, user.email);

      complaint.escalationLevel = 3;
      complaint.status = 'hq_escalated';
      complaint.escalatedAt = new Date();
      complaint.userActionRequired = 'none';
      // Save MLA contact info directly on the complaint for display
      complaint.mlaContact = {
        name: repName,
        type: repType,
        district,
        email: targetEmail,
        phone: rep?.phone || rep?.officePhone || '',
      };
      complaint.timeline.push({
        stage: 'hq_escalated',
        timestamp: new Date(),
        note: `🚨 FINAL ESCALATION: User sent complaint directly to ${repType} ${repName} (${targetEmail}) after ${daysOld} days of no action.`
      });
      complaint.notifications.push({
        message: `🚨 FINAL ESCALATION SENT! Your complaint has been sent to ${repType} ${repName} (${district}). They are legally obligated to act. Contact: ${rep?.phone || 'See office contact'}.`,
        type: 'danger'
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    complaint.lastUpdatedAt = new Date();
    await complaint.save();

    logger.info(`[Complaints] Action '${action}' done for complaint ${complaint._id}`);
    res.json(complaint);
  } catch (err) {
    logger.error('[Complaints] POST /:id/action error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
