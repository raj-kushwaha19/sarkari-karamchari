const logger = require('./logger');

/**
 * Proxy Mailer (Bypasses Render SMTP Block)
 * Sends the email request to our Next.js frontend (Vercel) which fully supports outbound SMTP.
 * No OAuth setup required, purely uses the App Password in Vercel's environment.
 */
const sendComplaintEmail = async (toEmail, subject, textContent, replyToEmail, complaintCode) => {
  try {
    // Determine the frontend URL to send the API request to
    // In production, this should be the Vercel app URL.
    const frontendUrl = process.env.FRONTEND_URL || 'https://sarkari-karamchari.vercel.app';
    
    logger.info(`[Mailer] Proxying email request to Vercel API at ${frontendUrl}`);

    const response = await fetch(`${frontendUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toEmail,
        subject,
        textContent,
        replyToEmail,
        complaintCode
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      logger.error(`[Mailer] Vercel API failed to send email: ${data.error}`);
      return { error: data.error || 'Vercel API failed to send email' };
    }

    logger.info(`[Mailer] ✅ Email successfully proxied via Vercel TO ${toEmail}. MessageID: ${data.messageId}`);
    return true;

  } catch (error) {
    logger.error(`[Mailer] ❌ Vercel Proxy Email failed to ${toEmail}: ${error.message}`);
    return { error: error.message };
  }
};

module.exports = { sendComplaintEmail };
