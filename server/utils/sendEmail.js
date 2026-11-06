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
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        
        <!-- HEADER LOGO -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:8px 16px;">
                  <span style="font-size:16px;font-weight:900;color:#ffffff;letter-spacing:-0.4px;">
                    📈 StockPulse
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- MAIN CARD -->
        <tr>
          <td style="background-color:#0e1626;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
            
            <!-- TOP ACCENT BAR -->
            <div style="height:4px;background:linear-gradient(90deg,#10b981,#3b82f6,#8b5cf6);"></div>

            <div style="padding:32px 32px 24px;">
              
              <!-- STATUS BADGE -->
              <div style="margin-bottom:20px;">
                <span style="display:inline-block;background:${isTest ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)"};border:1px solid ${isTest ? "rgba(59,130,246,0.3)" : "rgba(16,185,129,0.3)"};border-radius:999px;padding:6px 14px;">
                  <span style="color:${isTest ? "#60a5fa" : "#34d399"};font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">
                    ${isTest ? "⚡ Test Alert Verified" : "🚀 Price Alert Triggered"}
                  </span>
                </span>
              </div>

              <!-- STOCK SYMBOL & TITLE -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:6px 14px;">
                    <span style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:0.5px;">
                      ${cleaned}
                    </span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#9ca3af;font-size:12px;font-weight:600;background:rgba(255,255,255,0.04);padding:4px 8px;border-radius:6px;">
                      NSE · INDIA
                    </span>
                  </td>
                </tr>
              </table>

              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:16px 0 8px;line-height:1.3;">
                ${isTest ? `Test alert delivered for ${cleaned}` : `Your target price for ${cleaned} was reached!`}
              </h1>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6;">
                ${isTest
                  ? `This is a verification email from StockPulse. Your alert notification channel is active and configured correctly.`
                  : `StockPulse detected that <strong style="color:#ffffff;">${cleaned}</strong> moved ${isAbove ? "above" : "below"} your target threshold.`}
              </p>

              <!-- PRICE HIGHLIGHT BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#070d18;border:1px solid rgba(255,255,255,0.06);border-radius:16px;margin-bottom:24px;">
                <tr>
                  <td width="50%" style="padding:20px;border-right:1px solid rgba(255,255,255,0.06);">
                    <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 6px;">
                      Target Set
                    </p>
                    <p style="color:#ffffff;font-size:24px;font-weight:900;margin:0;">
                      ₹${formatPrice(targetPrice)}
                    </p>
                    <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">
                      Condition: ${isAbove ? "Reaches Above" : "Drops Below"}
                    </p>
                  </td>
                  <td width="50%" style="padding:20px;">
                    <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 6px;">
                      Market Price
                    </p>
                    <p style="color:#10b981;font-size:24px;font-weight:900;margin:0;">
                      ₹${formatPrice(currentPrice || targetPrice)}
                    </p>
                    <p style="color:#34d399;font-size:11px;margin:4px 0 0;">
                      ✓ Condition Met
                    </p>
                  </td>
                </tr>
              </table>

              <!-- DETAILS TABLE -->
              <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:12px 16px;margin-bottom:28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#64748b;font-size:12px;">Trigger Timestamp</td>
                    <td align="right" style="color:#cbd5e1;font-size:12px;font-weight:600;">${timestamp}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA BUTTONS -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${stockUrl}" target="_blank" style="display:inline-block;background:#10b981;color:#041a10;font-size:13px;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:12px;letter-spacing:0.2px;">
                      View ${cleaned} on StockPulse →
                    </a>
                  </td>
                  <td>
                    <a href="${frontendUrl}/alerts" target="_blank" style="display:inline-block;background:rgba(255,255,255,0.06);color:#e2e8f0;font-size:13px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);">
                      Manage Alerts
                    </a>
                  </td>
                </tr>
              </table>

            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="color:#475569;font-size:11px;margin:0 0 4px;">
              © ${new Date().getFullYear()} StockPulse · Realtime NSE Intelligence & Price Alerts
            </p>
            <p style="color:#334155;font-size:11px;margin:0;">
              You received this alert because you subscribed on StockPulse.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
  `;
};

/**
 * Create transport helper with IPv4 enforcement and strict timeouts.
 * Force IPv4 (family: 4) is critical on Render / AWS to prevent IPv6 hanging.
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
            This link expires in 20 minutes and can be used once. If you did not ask for a reset, you can ignore this email.
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

/**
 * Unified sendEmail helper.
 * Dual-port fallback: Tries port 465 (SSL) first, and falls back to port 587 (STARTTLS).
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
      if (opts.kind === "reset") {
        subject = "Reset your StockPulse password";
        text = `Reset your StockPulse password: ${opts.resetUrl}. This link expires in 20 minutes.`;
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
