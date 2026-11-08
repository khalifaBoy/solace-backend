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