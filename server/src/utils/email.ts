import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './logger';
import { env } from '../config/env';

let transporter: Transporter | null = null;

export const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  transporter.verify().then(() => logger.info('SMTP transporter ready')).catch(
    err => logger.error('SMTP verification failed', { err })
  );

  return transporter;
};

interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export const sendMail = async (opts: MailOptions): Promise<void> => {
  try {
    await getTransporter().sendMail({
      from: `"Savora" <${env.smtp.from}>`,
      ...opts,
    });
    logger.info('Email sent', { to: opts.to, subject: opts.subject });
  } catch (err) {
    logger.error('Email send failed', { err, to: opts.to });
    throw err;
  }
};

// ─── Email Templates ──────────────────────────────────────────
const baseLayout = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Inter, sans-serif; background: #111; color: #F7F5F2; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #1B1B1B; border-radius: 16px; border: 1px solid rgba(200,155,60,0.15); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1B1B1B, #222); padding: 32px; border-bottom: 1px solid rgba(200,155,60,0.1); }
    .logo { font-size: 28px; font-weight: 600; color: #C89B3C; letter-spacing: -0.5px; }
    .body { padding: 32px; }
    .btn { display: inline-block; background: #C89B3C; color: #111; font-weight: 600; padding: 12px 28px; border-radius: 10px; text-decoration: none; }
    .footer { padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.06); color: rgba(247,245,242,0.3); font-size: 12px; }
    h2 { color: #F7F5F2; margin-top: 0; }
    p { color: rgba(247,245,242,0.65); line-height: 1.7; }
    .highlight { color: #C89B3C; font-weight: 600; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><div class="logo">Savora</div></div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} Savora Restaurant · 12 Regal Lane, Bengaluru</div>
  </div>
</body>
</html>`;

export const emailTemplates = {
  welcomeEmail: (name: string): string =>
    baseLayout(`
      <h2>Welcome to Savora, ${name}.</h2>
      <p>We're delighted to have you with us. Explore our curated menu, make reservations, and earn loyalty points with every visit.</p>
      <hr class="divider"/>
      <a class="btn" href="${env.clientUrl}">Explore Savora →</a>
    `),

  emailVerification: (name: string, link: string): string =>
    baseLayout(`
      <h2>Verify your email</h2>
      <p>Hi ${name}, please confirm your email address to complete your registration.</p>
      <p>This link expires in <span class="highlight">24 hours</span>.</p>
      <a class="btn" href="${link}">Verify Email →</a>
    `),

  passwordReset: (name: string, link: string): string =>
    baseLayout(`
      <h2>Reset your password</h2>
      <p>Hi ${name}, we received a request to reset your password. Click below to choose a new one.</p>
      <p>This link expires in <span class="highlight">1 hour</span>. If you didn't request this, ignore this email.</p>
      <a class="btn" href="${link}">Reset Password →</a>
    `),

  orderConfirmation: (name: string, orderNumber: string, total: string): string =>
    baseLayout(`
      <h2>Order Confirmed</h2>
      <p>Hi ${name}, your order <span class="highlight">${orderNumber}</span> has been confirmed.</p>
      <p>Total: <span class="highlight">${total}</span></p>
      <p>We'll notify you as soon as your order is ready.</p>
      <a class="btn" href="${env.clientUrl}/orders">Track Order →</a>
    `),

  reservationConfirmation: (name: string, code: string, date: string, time: string, guests: number): string =>
    baseLayout(`
      <h2>Reservation Confirmed</h2>
      <p>Your table at Savora is reserved, ${name}.</p>
      <hr class="divider"/>
      <p><strong>Confirmation Code:</strong> <span class="highlight">${code}</span></p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Guests:</strong> ${guests}</p>
      <hr class="divider"/>
      <p>Please arrive 10 minutes early. To cancel, use your confirmation code on our website.</p>
    `),

  reservationReminder: (name: string, date: string, time: string): string =>
    baseLayout(`
      <h2>Reminder: Your reservation is tomorrow</h2>
      <p>Hi ${name}, just a friendly reminder that your table at Savora is reserved for <span class="highlight">${date} at ${time}</span>.</p>
      <p>We look forward to seeing you.</p>
    `),
};
