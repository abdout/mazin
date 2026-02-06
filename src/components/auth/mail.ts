import { Resend } from "resend";

// Lazy initialization to avoid errors when API key is not configured
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const domain = process.env.NEXT_PUBLIC_APP_URL;
const emailFrom = process.env.EMAIL_FROM || "noreply@mazin.sd";

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  const client = getResendClient();
  if (!client) {
    // Email not configured -- silently skip (never log tokens)
    return;
  }

  try {
    await client.emails.send({
      from: emailFrom,
      to: email,
      subject: "2FA Code",
      html: `<p>Your 2FA code: ${token}</p>`,
    });
  } catch (error) {
    console.error("Failed to send 2FA email");
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/new-password?token=${token}`;
  const client = getResendClient();
  if (!client) {
    return;
  }

  try {
    await client.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetLink}">here</a> to reset password.</p>`,
    });
  } catch (error) {
    console.error("Failed to send password reset email");
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/new-verification?token=${token}`;
  const client = getResendClient();
  if (!client) {
    return;
  }

  try {
    await client.emails.send({
      from: emailFrom,
      to: email,
      subject: "Confirm your email",
      html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`,
      text: `Click the following link to confirm your email: ${confirmLink}`
    });
  } catch (error) {
    console.error("Failed to send verification email");
  }
};
