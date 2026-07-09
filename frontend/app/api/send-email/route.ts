import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export async function POST(req: Request) {
  try {
    const { toEmail, subject, textContent, replyToEmail, complaintCode } = await req.json();

    const centralEmail = process.env.GMAIL_USER || 'sarkari.karamchari.official@gmail.com';
    const centralUserBase = centralEmail.split('@')[0];
    const trackingEmail = complaintCode ? `${centralUserBase}+${complaintCode}@gmail.com` : null;

    let replyToHeader = replyToEmail || centralEmail;
    if (replyToEmail && trackingEmail) {
      replyToHeader = `${replyToEmail}, ${trackingEmail}`;
    } else if (trackingEmail) {
      replyToHeader = trackingEmail;
    }

    // Force IPv4 for Nodemailer
    require('dns').setDefaultResultOrder('ipv4first');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4,
      auth: {
        user: process.env.GMAIL_USER as string,
        pass: process.env.GMAIL_APP_PASSWORD as string,
      },
      tls: { rejectUnauthorized: false },
    } as SMTPTransport.Options);

    await transporter.verify();

    const mailOptions = {
      from: `"Sarkari Karamchari Platform" <${centralEmail}>`,
      to: toEmail,
      replyTo: replyToHeader,
      subject: subject,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ success: true, messageId: info.messageId }, { status: 200 });

  } catch (error: any) {
    console.error('[Mailer API] Failed to send email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
