import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email, name, token) {
  const verificationUrl =
    `${process.env.APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your Solace account",

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to Solace, ${escapeHtml(name)}!</h2>

        <p>Please verify your email address to activate your account.</p>

        <a href="${verificationUrl}"
           style="display:inline-block;padding:12px 24px;
           background:#52796f;color:white;text-decoration:none;
           border-radius:8px;">
          Verify Email
        </a>

        <p>This link expires in 30 minutes.</p>

        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("Verification email could not be sent");
  }

  return data;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}


export async function sendPasswordResetEmail(email, name, token) {
  const resetUrl =
    `${process.env.FRONTEND_URL || process.env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your Solace password",

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Password Reset Request</h2>

        <p>Hello ${escapeHtml(name)},</p>

        <p>We received a request to reset your Solace account password.</p>

        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;
           background:#52796f;color:white;text-decoration:none;
           border-radius:8px;">
          Reset Password
        </a>

        <p>This link expires in 15 minutes.</p>

        <p>If you did not request this, you can ignore this email.</p>

        <p>Your reset token (for backend testing):</p>
        <code>${token}</code>
      </div>
    `,
  });

  if (error) {
    console.error("Resend password reset error:", error);
    throw new Error("Password reset email could not be sent");
  }

  return data;
}