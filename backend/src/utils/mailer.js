const nodemailer = require('nodemailer');
// CRITICAL: Force IPv4 globally. Node 18+ defaults to IPv6 which Render blocks outbound.
require('dns').setDefaultResultOrder('ipv4first');
const logger = require('./logger');
const User = require('../models/User');

// Platform central transporter — sends on behalf of any citizen
const createCentralTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Force IPv4 socket — prevents ENETUNREACH on Render
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

const sendComplaintEmail = async (toEmail, subject, textContent, replyToEmail, complaintCode) => {
  try {
    const centralEmail = process.env.GMAIL_USER;

    if (!centralEmail || !process.env.GMAIL_APP_PASSWORD) {
      logger.error('[Mailer] GMAIL_USER or GMAIL_APP_PASSWORD missing in environment!');
      return { error: 'Central email credentials not configured' };
    }

    const centralUserBase = centralEmail.split('@')[0];

    // Plus-addressing for complaint tracking
    const trackingEmail = complaintCode ? `${centralUserBase}+${complaintCode}@gmail.com` : null;

    // Reply-To: citizen email + tracking address
    let replyToHeader = replyToEmail || centralEmail;
    if (replyToEmail && trackingEmail) {
      replyToHeader = `${replyToEmail}, ${trackingEmail}`;
    } else if (trackingEmail) {
      replyToHeader = trackingEmail;
    }

    // ── SEND: From sarkari.karamchari.official on behalf of citizen ──
    const transporter = createCentralTransporter();

    // Verify SMTP connection first
    await transporter.verify();
    logger.info(`[Mailer] SMTP connection verified. Sending to ${toEmail}...`);

    const mailOptions = {
      from: `"Sarkari Karamchari Platform" <${centralEmail}>`,
      to: toEmail,
      replyTo: replyToHeader,
      subject: subject,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`[Mailer] ✅ Email sent FROM ${centralEmail} TO ${toEmail}. MessageID: ${info.messageId}`);
    return true;

  } catch (error) {
    logger.error(`[Mailer] ❌ Email failed to ${toEmail}: ${error.message}`);
    return { error: error.message };
  }
};

module.exports = { sendComplaintEmail };
