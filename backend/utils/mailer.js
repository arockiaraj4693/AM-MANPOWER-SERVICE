const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 0;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM =
  process.env.MAIL_FROM || "A M MANPOWER SERVICE <no-reply@example.com>";

let transporter = null;
const SMTP_SERVICE = process.env.SMTP_SERVICE || "";
if (SMTP_SERVICE) {
  transporter = nodemailer.createTransport({
    service: SMTP_SERVICE,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
} else if (SMTP_HOST && SMTP_PORT) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

async function sendMail(to, subject, html) {
  if (transporter) {
    try {
      await transporter.sendMail({ from: FROM, to, subject, html });
      return { ok: true };
    } catch (err) {
      console.error(
        "Mail send failed:",
        err && err.message ? err.message : err,
      );
      // fallback to console
    }
  }
  return { ok: true, fallback: true };
  return { ok: true, fallback: true };
}

module.exports = { sendMail };
