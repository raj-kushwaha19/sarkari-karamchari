const { Resend } = require('resend');
const logger = require('./logger');
const User = require('../models/User');

// Resend API-based email (works via HTTPS port 443, never blocked by Render)
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const sendComplaintEmail = async (toEmail, subject, textContent, replyToEmail, complaintCode) => {
  try {
    const centralEmail = process.env.GMAIL_USER || 'sarkari.karamchari.official@gmail.com';
    const centralUserBase = centralEmail.split('@')[0];

    // Create tracking email (plus-addressing)
    const trackingEmail = complaintCode ? `${centralUserBase}+${complaintCode}@gmail.com` : null;

    // Form Reply-To header
    let replyToHeader = replyToEmail;
    if (replyToEmail && trackingEmail) {
      replyToHeader = `${replyToEmail}, ${trackingEmail}`;
    } else if (trackingEmail) {
      replyToHeader = trackingEmail;
    }

    // ── PRIMARY: Resend API (HTTPS, never blocked by Render) ──
    const resend = getResendClient();
    if (resend) {
      logger.info(`[Mailer] Using Resend API to send email to ${toEmail}`);

      // Resend free tier requires sending from their domain unless you verify your own
      // We use onboarding@resend.dev as sender on free tier
      // If user verifies their domain, use: `"Sarkari Karamchari Platform" <noreply@yourdomain.com>`
      const senderName = 'Sarkari Karamchari Platform';
      // Try user's verified domain first, fallback to Resend's free domain
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      const result = await resend.emails.send({
        from: `${senderName} <${fromAddress}>`,
        to: [toEmail],
        reply_to: replyToHeader || centralEmail,
        subject: subject,
        text: textContent,
      });

      if (result.error) {
        logger.error(`[Mailer] Resend API error: ${JSON.stringify(result.error)}`);
        return { error: result.error.message || 'Resend API failed' };
      }

      logger.info(`[Mailer] ✅ Resend Email sent successfully TO ${toEmail}. ID: ${result.data?.id}`);
      return true;
    }

    // ── FALLBACK: No email service configured ──
    logger.warn(`[Mailer] No email service configured. RESEND_API_KEY missing.`);
    return { error: 'No email service configured. Please set RESEND_API_KEY in Render environment variables.' };

  } catch (error) {
    logger.error(`[Mailer] Email dispatch failed to ${toEmail}:`, error.message);
    return { error: error.message };
  }
};

module.exports = { sendComplaintEmail };
