// server/utils/sendEmail.js
const nodemailer = require("nodemailer");

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);

const cleanSymbol = (symbol = "") =>
  String(symbol).replace(".NS", "").replace(".BO", "").toUpperCase();

const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) return "—";
  return Number(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getTimestamp = () =>
  new Date().toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }) + " IST";

// Parse alert info from legacy text format if needed
const parseAlertText = (text = "") => {
  const symbolMatch = text.match(/^([A-Za-z0-9.&_-]+)\s/);
  const priceMatch = text.match(/₹\s*([\d,.]+)/);
  const symbol = symbolMatch ? cleanSymbol(symbolMatch[1]) : "STOCK";
  const target = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : null;
  return { symbol, target };
};

const buildHtml = ({ symbol, targetPrice, currentPrice, condition = "above", isTest = false }) => {
  const rawSymbol = cleanSymbol(symbol);
  const cleaned = escapeHtml(rawSymbol);
  const timestamp = getTimestamp();
  const frontendUrl = escapeHtml(
    (process.env.FRONTEND_URL || "https://stockpulse-mu-three.vercel.app").replace(/\/+$/, "")
  );
  const stockUrl = `${frontendUrl}/stock/${encodeURIComponent(rawSymbol)}`;
  const isAbove = condition === "above";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>StockPulse Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#080d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f3f4f6;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080d1a;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#0e1626;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;box-shadow:0 20px 40px -10px rgba(0,0,0,0.5);">
        <!-- Top Accent Bar -->
        <tr>
          <td height="4" style="background:linear-gradient(90deg, #10b981 0%, #059669 100%);"></td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="padding:28px 32px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:18px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;display:inline-block;">
                    StockPulse <span style="font-size:11px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:1px;margin-left:4px;border:1px solid rgba(16,185,129,0.3);padding:2px 6px;border-radius:6px;background:rgba(16,185,129,0.08);">PRO</span>
                  </span>
                </td>
                <td align="right">
                  <span style="font-size:11px;font-weight:700;color:${isTest ? "#60a5fa" : "#34d399"};background:${isTest ? "rgba(96,165,250,0.1)" : "rgba(16,185,129,0.1)"};border:1px solid ${isTest ? "rgba(96,165,250,0.3)" : "rgba(16,185,129,0.3)"};padding:4px 10px;border-radius:20px;display:inline-block;">
                    ${isTest ? "⚡ TEST ALERT" : "● LIVE TRIGGER"}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Alert Hero Banner -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">
                ${cleaned} reached your target
              </p>
              <h1 style="margin:0;font-size:38px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1.1;">
                ₹${formatPrice(currentPrice)}
              </h1>
              <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">
                Target set: <strong style="color:#d1d5db;">${isAbove ? "≥" : "≤"} ₹${formatPrice(targetPrice)}</strong>
              </p>
            </div>
          </td>
        </tr>

        <!-- Metric Cards -->
        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" style="background:#080d1a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 16px;">
                  <span style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">Target Condition</span>
                  <span style="font-size:14px;font-weight:800;color:${isAbove ? "#34d399" : "#f87171"};">
                    ${isAbove ? "▲ Breaks Above" : "▼ Drops Below"}
                  </span>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background:#080d1a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 16px;">
                  <span style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">Exchange</span>
                  <span style="font-size:14px;font-weight:800;color:#ffffff;">NSE India</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:0 32px 32px;text-align:center;">
            <a href="${stockUrl}" target="_blank" style="display:inline-block;width:100%;box-sizing:border-box;background:#10b981;color:#041a10;font-size:14px;font-weight:800;text-align:center;text-decoration:none;padding:14px 24px;border-radius:12px;box-shadow:0 4px 12px rgba(16,185,129,0.3);letter-spacing:0.3px;">
              View ${cleaned} on StockPulse →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#060a14;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:#4b5563;">
              Triggered at ${escapeHtml(timestamp)} · Real-time market engine
            </p>
            <p style="margin:0;font-size:10px;color:#374151;">
              You received this because you configured a price alert on StockPulse. Educational & informational use only. Not investment advice.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};

const buildResetHtml = (resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#080d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080d1a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;background:#0e1626;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 12px;color:#fbbf24;font-size:12px;font-weight:800;letter-spacing:0.8px;">STOCKPULSE</p>
          <h1 style="margin:0 0 12px;color:#fff;font-size:22px;">Reset your password</h1>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
            This link expires in 30 minutes and can be used once. If you did not ask for a reset, you can ignore this email.
          </p>
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#10b981;color:#041a10;font-size:13px;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:12px;">
            Choose a new password
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const buildVerifyHtml = (verifyUrl) => `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#080d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080d1a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;background:#0e1626;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 12px;color:#fbbf24;font-size:12px;font-weight:800;letter-spacing:0.8px;">STOCKPULSE</p>
          <h1 style="margin:0 0 12px;color:#fff;font-size:22px;">Verify your email address</h1>
          <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
            Welcome to StockPulse! Please verify your email to activate instant price alert notifications and account security. This link expires in 24 hours.
          </p>
          <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#10b981;color:#041a10;font-size:13px;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:12px;">
            Verify Email Address
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/**
 * Create transport helper with IPv4 enforcement and strict timeouts.
 */
function createGmailTransport(port = 465, secure = true) {
  const cleanPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: cleanPass,
    },
    family: 4, // Prevent IPv6 hanging in Linux cloud containers (Render, AWS, DigitalOcean)
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
}

/**
 * Unified sendEmail helper.
 */
const sendEmail = async (param1, param2, param3) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("[Email] EMAIL_USER or EMAIL_PASS not configured. Skipping email.");
      return { success: false, error: "EMAIL_USER or EMAIL_PASS not configured" };
    }

    let to, subject, html, text;

    if (typeof param1 === "object" && param1 !== null) {
      const opts = param1;
      to = opts.to;
      if (opts.kind === "verify") {
        subject = "Verify your StockPulse email";
        text = `Verify your StockPulse email: ${opts.verifyUrl}. This link expires in 24 hours.`;
        html = buildVerifyHtml(opts.verifyUrl);
      } else if (opts.kind === "reset") {
        subject = "Reset your StockPulse password";
        text = `Reset your StockPulse password: ${opts.resetUrl}. This link expires in 30 minutes.`;
        html = buildResetHtml(opts.resetUrl);
      } else {
        const clean = cleanSymbol(opts.symbol);
        subject = opts.isTest
          ? `⚡ StockPulse Test Alert: ${clean}`
          : `🚀 Alert Triggered: ${clean} reached ₹${formatPrice(opts.targetPrice)}`;
        text = opts.isTest
          ? `StockPulse Test Alert for ${clean}`
          : `${clean} has reached your target price of ₹${formatPrice(opts.targetPrice)} (Current: ₹${formatPrice(opts.currentPrice)})`;
        html = buildHtml(opts);
      }
    } else {
      to = param1;
      subject = param2;
      text = param3;
      const parsed = parseAlertText(text);
      html = buildHtml({
        symbol: parsed.symbol,
        targetPrice: parsed.target,
        currentPrice: parsed.target,
        condition: "above",
      });
    }

    if (!to || !to.includes("@")) {
      console.warn("[Email] Invalid recipient email:", to);
      return { success: false, error: "Invalid recipient email" };
    }

    const mailOptions = {
      from: `"StockPulse Alerts 📈" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    // Attempt 1: Port 465 (SSL) with IPv4
    try {
      const transporter465 = createGmailTransport(465, true);
      const info = await transporter465.sendMail(mailOptions);
      console.log(`[Email] ✓ Delivered to ${to} via port 465 (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, port: 465 };
    } catch (err465) {
      console.warn(`[Email] Port 465 failed (${err465.message}), attempting fallback to port 587...`);
      
      // Attempt 2: Port 587 (STARTTLS) with IPv4
      const transporter587 = createGmailTransport(587, false);
      const info = await transporter587.sendMail(mailOptions);
      console.log(`[Email] ✓ Delivered to ${to} via fallback port 587 (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, port: 587 };
    }
  } catch (error) {
    console.error("[Email] ✗ Failed to send email:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
