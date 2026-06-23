const BRAND = {
  primary: '#260B10',
  accent: '#BF8B5E',
  accentLight: '#D9B89C',
  white: '#FFFFFF',
  offWhite: '#FAF7F4',
  textDark: '#1A1A1A',
  textMuted: '#6B6B6B',
  borderColor: '#E8E0D8',
};

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Savora</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.offWhite};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.offWhite};padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
        style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid ${BRAND.borderColor};max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background-color:${BRAND.primary};padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:3px;color:${BRAND.accent};font-family:Georgia,serif;">
              SAVORA
            </p>
            <p style="margin:6px 0 0;font-size:11px;letter-spacing:2px;color:${BRAND.accentLight};text-transform:uppercase;">
              Restaurant Management
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:${BRAND.offWhite};padding:24px 40px;border-top:1px solid ${BRAND.borderColor};text-align:center;">
            <p style="margin:0;font-size:12px;color:${BRAND.textMuted};">
              © ${new Date().getFullYear()} Savora · All rights reserved
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:${BRAND.textMuted};">
              This email was sent to you because you have an account with Savora.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const heading = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.textDark};font-family:Georgia,serif;">${text}</h1>`;

const subheading = (text: string) =>
  `<p style="margin:0 0 24px;font-size:15px;color:${BRAND.textMuted};">${text}</p>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid ${BRAND.borderColor};margin:24px 0;" />`;

const bodyText = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.textDark};">${text}</p>`;

const ctaButton = (text: string, href: string) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px;background-color:${BRAND.accent};">
        <a href="${href}" target="_blank"
          style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;
                 color:#fff;text-decoration:none;letter-spacing:0.5px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;

const otpBox = (otp: string) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
    <tr>
      <td align="center" style="background-color:${BRAND.offWhite};border:2px dashed ${BRAND.accent};border-radius:10px;padding:28px;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;color:${BRAND.textMuted};text-transform:uppercase;">Your OTP Code</p>
        <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:${BRAND.primary};font-family:Georgia,serif;">${otp}</p>
      </td>
    </tr>
  </table>`;

const noteBox = (text: string) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="background-color:#FEF9F4;border-left:3px solid ${BRAND.accent};border-radius:0 6px 6px 0;padding:14px 16px;margin:16px 0;">
        <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">${text}</p>
      </td>
    </tr>
  </table>`;

// ─── Templates ────────────────────────────────────────────────

export const welcomeEmail = (name: string): string =>
  base(`
    ${heading(`Welcome to Savora, ${name}!`)}
    ${subheading('Your account has been created successfully.')}
    ${divider()}
    ${bodyText(`Hi <strong>${name}</strong>, we're thrilled to have you on board. Savora helps you discover, reserve, and order from the finest restaurants — all in one place.`)}
    ${bodyText('Start by exploring restaurants near you, making a reservation, or ordering your favourite dishes.')}
    ${noteBox('If you didn\'t create this account, please ignore this email or contact us immediately.')}
  `);

export const verificationEmail = (name: string, verifyUrl: string): string =>
  base(`
    ${heading('Verify Your Email')}
    ${subheading('One quick step before you dive in.')}
    ${divider()}
    ${bodyText(`Hi <strong>${name}</strong>, thanks for signing up! Please confirm your email address to activate your account.`)}
    ${ctaButton('Verify Email Address', verifyUrl)}
    ${noteBox('This link expires in <strong>24 hours</strong>. If you didn\'t sign up for Savora, you can safely ignore this email.')}
    ${bodyText(`Or copy and paste this URL into your browser:<br/><span style="color:${BRAND.accent};font-size:13px;word-break:break-all;">${verifyUrl}</span>`)}
  `);

export const passwordResetEmail = (name: string, otp: string): string =>
  base(`
    ${heading('Reset Your Password')}
    ${subheading('Use the OTP below to reset your password.')}
    ${divider()}
    ${bodyText(`Hi <strong>${name}</strong>, we received a request to reset your Savora password.`)}
    ${otpBox(otp)}
    ${noteBox('This OTP expires in <strong>10 minutes</strong>. If you didn\'t request a password reset, please ignore this email — your account remains secure.')}
    ${bodyText('Never share this OTP with anyone, including Savora support.')}
  `);

export const passwordChangedEmail = (name: string): string =>
  base(`
    ${heading('Password Changed')}
    ${subheading('Your Savora password has been updated.')}
    ${divider()}
    ${bodyText(`Hi <strong>${name}</strong>, this is a confirmation that your password was successfully changed.`)}
    ${noteBox('If you did not make this change, please contact us immediately at <strong>support@savora.com</strong> and reset your password right away.')}
  `);
