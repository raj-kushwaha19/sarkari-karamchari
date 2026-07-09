const nodemailer = require('nodemailer');
const logger = require('./logger');
const User = require('../models/User');

// Platform central transporter (used as fallback)
const centralTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // Explicitly use 465 (Secure) as port 587 is often blocked by Render
  secure: true,
  family: 4, // Force IPv4. Render often fails on IPv6 (ENETUNREACH) to Google SMTP
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendComplaintEmail = async (toEmail, subject, textContent, replyToEmail, complaintCode) => {
  try {
    const centralEmail = process.env.GMAIL_USER || 'sarkari.karamchari.official@gmail.com';
    const centralUserBase = centralEmail.split('@')[0];
    
    // Create tracking email (plus-addressing: e.g. sarkari.karamchari.official+WRVP-SMJ3-2NBK-VV5L@gmail.com)
    const trackingEmail = complaintCode ? `${centralUserBase}+${complaintCode}@gmail.com` : null;
    
    // Form Reply-To header: includes citizen's email and the platform tracking email
    let replyToHeader = replyToEmail;
    if (replyToEmail && trackingEmail) {
      replyToHeader = `${replyToEmail}, ${trackingEmail}`;
    } else if (trackingEmail) {
      replyToHeader = trackingEmail;
    }

    // ── OAUTH2 DISPATCH: Try to send from the Citizen's own Gmail account ──
    if (replyToEmail) {
      const citizen = await User.findOne({ email: replyToEmail }).select('+gmailRefreshToken');
      if (citizen && citizen.gmailRefreshToken) {
        try {
          logger.info(`[Mailer] Attempting OAuth2 dispatch directly from citizen email: ${replyToEmail}`);
          
          const oauthTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: replyToEmail,
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              refreshToken: citizen.gmailRefreshToken,
            },
          });

          const mailOptions = {
            from: `"${citizen.name}" <${replyToEmail}>`,
            to: toEmail,
            replyTo: replyToHeader,
            subject: subject,
            text: textContent,
          };

          const info = await oauthTransporter.sendMail(mailOptions);
          logger.info(`[Mailer] ✅ OAuth2 Email sent successfully FROM citizen ${replyToEmail} TO ${toEmail}: ${info.messageId}`);
          return true;
        } catch (oauthError) {
          logger.warn(`[Mailer] OAuth2 dispatch failed for ${replyToEmail}, falling back to central account. Error: ${oauthError.message}`);
          // Do not return here; let it fall through to the central dispatch fallback below
        }
      }
    }

    // ── FALLBACK DISPATCH: Send from central platform account ──
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logger.warn(`[Mailer] [SIMULATION] Central credentials missing. Simulated dispatch to ${toEmail}`);
      return { error: 'Central credentials missing' };
    }

    logger.info(`[Mailer] Sending from Central SMTP (${centralEmail}) on behalf of ${replyToEmail || 'citizen'}`);
    const mailOptions = {
      from: `"Sarkari Karamchari Platform" <${centralEmail}>`,
      to: toEmail,
      replyTo: replyToHeader || centralEmail,
      subject: subject,
      text: textContent,
    };

    const info = await centralTransporter.sendMail(mailOptions);
    logger.info(`[Mailer] ✅ Central Email sent successfully TO ${toEmail}: ${info.messageId}`);
    return true;

  } catch (error) {
    logger.error(`[Mailer] Email dispatch failed to ${toEmail}:`, error.message);
    return { error: error.message }; 
  }
};


module.exports = { sendComplaintEmail };
