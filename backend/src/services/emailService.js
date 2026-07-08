require('dotenv').config();
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const getTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

const sendComplaintEmail = async ({ to, complaintId, department, formalEmail, userName }) => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn('[Email] Email service not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing)');
    return { success: false, error: 'Email service not configured' };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"Sarkari Karamchari" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Complaint Ref #${complaintId} — ${department} — Citizen Grievance`,
      text: formalEmail,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6B7FD7;">Sarkari Karamchari — Citizen Grievance Portal</h2>
        <p style="color: #666;">Reference #${complaintId} | Filed by: ${userName}</p>
        <hr/>
        <pre style="white-space: pre-wrap; font-family: Arial; line-height: 1.6;">${formalEmail}</pre>
        <hr/>
        <p style="color: #999; font-size: 12px;">This complaint was filed via Sarkari Karamchari — powered by Gen-Z Solutions</p>
      </div>`,
    });
    logger.info(`[Email] Complaint email sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error('[Email] sendComplaintEmail failed:', err.message);
    return { success: false, error: 'Email service error' };
  }
};

const sendFollowUpEmail = async ({ complaint, user, deptEmail }) => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn('[Email] Email service not configured');
    return { success: false, error: 'Email service not configured' };
  }
  
  const filedDate = complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-IN') : 'earlier';
  const today = new Date().toLocaleDateString('en-IN');
  const complaintId = complaint._id.toString().slice(-8).toUpperCase();
  
  const emailText = `Subject: Follow-up: Complaint Ref #${complaintId} — ${complaint.department} — Urgent Resolution Required

Respected Sir/Madam,

This is a formal follow-up to my complaint filed on ${filedDate} regarding the following matter:

"${complaint.description.raw}"

As of ${today}, 96 hours (4 days) have elapsed since the initial complaint was filed without any response, acknowledgement, or resolution from your department.

I request your immediate attention to this matter and urge you to:
1. Acknowledge receipt of this complaint within 24 hours
2. Provide an expected timeline for resolution
3. Take necessary corrective action at the earliest

Complaint Reference: #${complaintId}
Department: ${complaint.department}
Location PIN Code: ${complaint.location?.pinCode || 'Not specified'}
Filed by: ${user.name} (${user.email})
Original Filing Date: ${filedDate}

This follow-up is being sent through the Sarkari Karamchari citizen grievance platform. Continued non-response may necessitate escalation to senior authorities.

Yours faithfully,
${user.name}
${user.email}

---
Filed via Sarkari Karamchari — Aapki Awaaz, Sidha Samadhan
Powered by Gen-Z Solutions`;

  try {
    const to = deptEmail || process.env.GMAIL_USER; // Fallback to self if dept email not found
    const info = await transporter.sendMail({
      from: `"Sarkari Karamchari" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: user.email,
      subject: `Follow-up: Complaint Ref #${complaintId} — ${complaint.department} — Urgent Resolution Required`,
      text: emailText,
    });
    logger.info(`[Email] Follow-up email sent: ${info.messageId} for complaint ${complaint._id}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error('[Email] sendFollowUpEmail failed:', err.message);
    return { success: false, error: 'Email service error' };
  }
};

const sendEscalationEmail = async ({ complaint, user, representative, deptContact, escalationEmailText }) => {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn('[Email] Email service not configured');
    return { success: false, error: 'Email service not configured' };
  }
  
  const complaintId = complaint._id.toString().slice(-8).toUpperCase();
  
  try {
    const to = representative.email;
    if (!to) {
      return { success: false, error: 'Representative email not available' };
    }
    
    const info = await transporter.sendMail({
      from: `"Sarkari Karamchari" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: user.email,
      subject: `Ministerial Escalation: Unresolved Complaint #${complaintId} — Urgent Intervention Required`,
      text: escalationEmailText || `Dear ${representative.name},\n\nI am writing to request your urgent intervention regarding an unresolved complaint...`,
    });
    logger.info(`[Email] Escalation email sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error('[Email] sendEscalationEmail failed:', err.message);
    return { success: false, error: 'Email service error' };
  }
};

const sendAdminNotification = async (pendingCount) => {
  const transporter = getTransporter();
  if (!transporter) return { success: false, error: 'Email service not configured' };
  
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  if (adminEmails.length === 0) {
    logger.warn('[Email] No ADMIN_EMAILS configured for notification');
    return { success: false, error: 'No admin emails configured' };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"Sarkari Karamchari System" <${process.env.GMAIL_USER}>`,
      to: adminEmails.join(','),
      subject: `[Admin] ${pendingCount} new records pending review in Sarkari Karamchari`,
      text: `Hello Admin,\n\nThe weekly data scraper has found ${pendingCount} new or changed record(s) that require your review and approval before going live.\n\nPlease log in to the admin panel and visit the Review Queue to approve or reject these records.\n\nURL: ${process.env.FRONTEND_URL}/admin/review-queue\n\n---\nSarkari Karamchari System`,
    });
    logger.info(`[Email] Admin notification sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error('[Email] sendAdminNotification failed:', err.message);
    return { success: false, error: 'Email service error' };
  }
};

module.exports = { sendComplaintEmail, sendFollowUpEmail, sendEscalationEmail, sendAdminNotification };
