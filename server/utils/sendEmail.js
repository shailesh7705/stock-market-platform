const nodemailer = require("nodemailer");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cleanSymbol = (symbol = "") =>
  symbol.replace(".NS", "").replace(".BO", "").toUpperCase();

const formatPrice = (price) =>
  Number(price).toLocaleString("en-IN", { maximumFractionDigits: 2 });

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

// ─── Parse alert info from plain text message ─────────────────────────────────
// text format: "SYMBOL.NS has reached your target price of ₹PRICE"
const parseAlertText = (text = "") => {
  const symbolMatch = text.match(/^([A-Z0-9.]+)\s/);
  const priceMatch  = text.match(/₹([\d,]+)/);
  const symbol      = symbolMatch ? cleanSymbol(symbolMatch[1]) : "STOCK";
  const target      = priceMatch  ? priceMatch[1].replace(",", "") : "—";
  return { symbol, target };
};

// ─── HTML Template ────────────────────────────────────────────────────────────
const buildHtml = (subject, text) => {
  const { symbol, target } = parseAlertText(text);
  const timestamp = getTimestamp();
  const stockUrl  = `${process.env.FRONTEND_URL || "http://localhost:5173"}/stock/${symbol}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>StockPulse Alert</title>
</head>
<body style="margin:0;padding:0;background:#07090f;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;padding:36px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;">

  <!-- LOGO ROW -->
  <tr><td align="center" style="padding-bottom:22px;">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#22c55e;border-radius:10px;padding:7px 14px;">
          <span style="font-size:14px;font-weight:800;color:#000;letter-spacing:-0.3px;">
            ↗ StockPulse
          </span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- MAIN CARD -->
  <tr><td style="background:#0d1117;border:1px solid rgba(255,255,255,0.08);
                 border-radius:20px;overflow:hidden;">

    <!-- GREEN TOP BAR -->
    <div style="height:3px;background:linear-gradient(90deg,#22c55e,#10b981,#14b8a6);"></div>

    <div style="padding:30px 28px 0;">

      <!-- TRIGGERED BADGE -->
      <div style="margin-bottom:20px;">
        <span style="display:inline-flex;align-items:center;gap:7px;
                     background:rgba(34,197,94,0.1);
                     border:1px solid rgba(34,197,94,0.25);
                     border-radius:30px;padding:5px 13px;">
          <span style="width:6px;height:6px;background:#22c55e;
                       border-radius:50%;display:inline-block;"></span>
          <span style="color:#22c55e;font-size:10px;font-weight:700;
                       letter-spacing:0.8px;text-transform:uppercase;">
            Price Alert Triggered
          </span>
        </span>
      </div>

      <!-- SYMBOL HERO -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
        <tr>
          <td style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.2);
                     border-radius:10px;padding:6px 14px;vertical-align:middle;">
            <span style="color:#22c55e;font-size:20px;font-weight:900;
                         letter-spacing:0.5px;">
              ${symbol}
            </span>
          </td>
          <td style="padding-left:12px;vertical-align:middle;">
            <span style="color:#9ca3af;font-size:12px;">NSE</span>
          </td>
        </tr>
      </table>

      <h1 style="color:#ffffff;font-size:19px;font-weight:800;
                 margin:10px 0 6px;letter-spacing:-0.3px;">
        Your target price was hit!
      </h1>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px;line-height:1.6;">
        ${text.replace(symbol + ".NS", "<strong style='color:#e5e7eb;'>" + symbol + "</strong>")}
      </p>
    </div>

    <!-- PRICE COMPARISON CARD -->
    <div style="margin:0 28px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#070a10;border:1px solid rgba(255,255,255,0.06);
                    border-radius:14px;overflow:hidden;">
        <tr>
          <td width="50%" style="padding:18px 20px;
                                  border-right:1px solid rgba(255,255,255,0.06);">
            <p style="color:#6b7280;font-size:10px;font-weight:600;
                      letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">
              Your Target
            </p>
            <p style="color:#ffffff;font-size:24px;font-weight:800;
                      margin:0;letter-spacing:-0.5px;">
              ₹${formatPrice(target)}
            </p>
          </td>
          <td width="50%" style="padding:18px 20px;">
            <p style="color:#6b7280;font-size:10px;font-weight:600;
                      letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">
              Alert Status
            </p>
            <p style="color:#22c55e;font-size:16px;font-weight:800;margin:0;">
              ✓ Reached
            </p>
            <p style="color:#4b5563;font-size:11px;margin:4px 0 0;">
              Condition met
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- TIMESTAMP ROW -->
    <div style="margin:0 28px 24px;padding:12px 16px;
                background:rgba(255,255,255,0.02);
                border:1px solid rgba(255,255,255,0.05);border-radius:10px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="color:#6b7280;font-size:11px;">🕐 Triggered at</span>
          </td>
          <td align="right">
            <span style="color:#9ca3af;font-size:11px;font-weight:600;">
              ${timestamp}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA BUTTONS -->
    <div style="padding:0 28px 30px;display:flex;gap:12px;">
      <a href="${stockUrl}"
         style="display:inline-block;background:#22c55e;color:#000;
                font-size:13px;font-weight:700;text-decoration:none;
                padding:12px 24px;border-radius:10px;margin-right:10px;">
        View ${symbol} →
      </a>
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard"
         style="display:inline-block;background:rgba(255,255,255,0.06);
                color:#d1d5db;font-size:13px;font-weight:600;
                text-decoration:none;padding:12px 24px;border-radius:10px;
                border:1px solid rgba(255,255,255,0.1);">
        Dashboard
      </a>
    </div>

  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding-top:20px;text-align:center;">
    <p style="color:#374151;font-size:11px;margin:0 0 3px;">
      © ${new Date().getFullYear()} StockPulse · NSE Market Intelligence
    </p>
    <p style="color:#374151;font-size:11px;margin:0;">
      You received this because you have an active StockPulse account.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
  `;
};

// ─── sendEmail — EXACT SAME SIGNATURE ────────────────────────────────────────
const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"StockPulse 📈" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,                        // plain text fallback
      html:    buildHtml(subject, text),
    });

    console.log(`[Email] ✓ Sent to ${to}`);
  } catch (error) {
    console.log("[Email] ✗ Failed:", error.message);
  }
};

module.exports = sendEmail;