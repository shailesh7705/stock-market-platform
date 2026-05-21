// client/src/components/ui/StockLogo.jsx
import { useState } from "react";

// ─── NSE Symbol → Company Domain mapping ─────────────────────────────────────
// Add more as needed
const SYMBOL_DOMAIN_MAP = {
  RELIANCE:    "ril.com",
  TCS:         "tcs.com",
  INFY:        "infosys.com",
  HDFCBANK:    "hdfcbank.com",
  ICICIBANK:   "icicibank.com",
  SBIN:        "sbi.co.in",
  BAJFINANCE:  "bajajfinserv.in",
  WIPRO:       "wipro.com",
  AXISBANK:    "axisbank.com",
  LT:          "larsentoubro.com",
  KOTAKBANK:   "kotak.com",
  HINDUNILVR:  "hul.co.in",
  MARUTI:      "marutisuzuki.com",
  TITAN:       "titancompany.in",
  NESTLEIND:   "nestle.in",
  ASIANPAINT:  "asianpaints.com",
  TECHM:       "techmahindra.com",
  HCLTECH:     "hcltech.com",
  ULTRACEMCO:  "ultratechcement.com",
  POWERGRID:   "powergridindia.com",
  NTPC:        "ntpc.co.in",
  ONGC:        "ongcindia.com",
  COALINDIA:   "coalindia.in",
  TATAMOTORS:  "tatamotors.com",
  TATASTEEL:   "tatasteel.com",
  ADANIPORTS:  "adaniports.com",
  ADANIENT:    "adani.com",
  ADANIGREEN:  "adanigreen.com",
  SUNPHARMA:   "sunpharma.com",
  DRREDDY:     "drreddys.com",
  CIPLA:       "cipla.com",
  DIVISLAB:    "divislaboratories.com",
  BHARTIARTL:  "airtel.in",
  JIO:         "jio.com",
  BAJAJFINSV:  "bajajfinserv.in",
  HDFCLIFE:    "hdfclife.com",
  SBILIFE:     "sbilife.co.in",
  ICICIlombard:"icicilombard.com",
  ICICIGI:     "icicigi.com",
  INDUSINDBK:  "indusind.com",
  FEDERALBNK:  "federalbank.co.in",
  BANDHANBNK:  "bandhanbank.com",
  IDFCFIRSTB:  "idfcfirstbank.com",
  UJJIVANSFB:  "ujjivansfb.com",
  AUBANK:      "aubank.in",
  YESBANK:     "yesbank.in",
  PNB:         "pnbindia.in",
  CANBK:       "canarabank.com",
  BANKBARODA:  "bankofbaroda.in",
  UNIONBANK:   "unionbankofindia.co.in",
  GRASIM:      "grasim.com",
  AMBUJACEM:   "ambujacement.com",
  ACC:         "acclimited.com",
  SHREECEM:    "shreecement.com",
  HEROMOTOCO:  "heromotocorp.com",
  BAJAJ_AUTO:  "bajajauto.com",
  EICHERMOT:   "eichergroup.com",
  APOLLOHOSP:  "apollohospitals.com",
  FORTIS:      "fortishealthcare.com",
  MAXHEALTH:   "maxhealthcare.in",
  ZOMATO:      "zomato.com",
  NYKAA:       "nykaa.com",
  PAYTM:       "paytm.com",
  POLICYBZR:   "policybazaar.com",
  DMART:       "dmart.in",
  TRENT:       "trent.in",
  VEDL:        "vedanta.com",
  HINDALCO:    "hindalco.com",
  JSWSTEEL:    "jsw.in",
  SAIL:        "sail.co.in",
  BPCL:        "bharatpetroleum.com",
  IOC:         "iocl.com",
  HINDPETRO:   "hindustanpetroleum.com",
  GAIL:        "gailonline.com",
  ITC:         "itcportal.com",
  GODREJCP:    "godrejcp.com",
  MARICO:      "marico.com",
  DABUR:       "dabur.com",
  BRITANNIA:   "britannia.co.in",
  MCDOWELL_N:  "unitedspirits.com",
  PIDILITIND:  "pidilite.com",
  BERGEPAINT:  "bergerpaints.com",
  HAVELLS:     "havells.com",
  VOLTAS:      "voltas.com",
  WHIRLPOOL:   "whirlpoolindia.com",
  SIEMENS:     "siemens.co.in",
  ABB:         "abb.co.in",
  BEL:         "bel-india.in",
  HAL:         "hal-india.co.in",
  IRFC:        "irfc.nic.in",
  PFC:         "pfcindia.com",
  REC:         "recindia.nic.in",
  MUTHOOTFIN:  "muthootfinance.com",
  CHOLAFIN:    "chola.in",
  SRTRANSFIN:  "srtransfinance.com",
  MINDTREE:    "ltimindtree.com",
  LTIM:        "ltimindtree.com",
  MPHASIS:     "mphasis.com",
  COFORGE:     "coforge.com",
  PERSISTENT:  "persistent.com",
  ZENSARTECH:  "zensar.com",
  TATAELXSI:   "tataelxsi.com",
  KPITTECH:    "kpit.com",
  CYIENT:      "cyient.com",
  TATACOMM:    "tatacomm.com",
  IRCTC:       "irctc.co.in",
  INDIGO:      "goindigo.in",
  SPICEJET:    "spicejet.com",
  INTERGLOBE:  "goindigo.in",
};

// ─── Color palette for initials fallback ─────────────────────────────────────
const COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#14b8a6",
  "#f97316", "#6366f1",
];

function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

/**
 * StockLogo — shows company logo with graceful fallback to colored initials
 *
 * @param {string}  symbol   — NSE symbol e.g. "RELIANCE" or "RELIANCE.NS"
 * @param {string}  name     — company name (used for fallback initials)
 * @param {number}  size     — width/height in px (default 36)
 * @param {string}  className
 */
function StockLogo({ symbol = "", name = "", size = 36, className = "" }) {
  const [imgError, setImgError] = useState(false);

  const clean   = symbol.replace(".NS", "").replace(".BO", "").toUpperCase();
  const domain  = SYMBOL_DOMAIN_MAP[clean];
  const logoUrl = domain
    ? `https://logo.clearbit.com/${domain}`
    : null;

  const initials = clean.slice(0, 2);
  const bgColor  = hashColor(clean);
  const radius   = Math.round(size * 0.28);

  // Show initials if: no domain mapping, or image failed to load
  if (!logoUrl || imgError) {
    return (
      <div
        className={`flex items-center justify-center font-bold text-white shrink-0 ${className}`}
        style={{
          width:        size,
          height:       size,
          borderRadius: radius,
          background:   bgColor,
          fontSize:     Math.round(size * 0.36),
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 overflow-hidden bg-white flex items-center justify-center ${className}`}
      style={{
        width:        size,
        height:       size,
        borderRadius: radius,
      }}
    >
      <img
  src={logoUrl}
  alt={clean}
  width={size}
  height={size}
  style={{
    objectFit: "contain",
    padding: Math.round(size * 0.08)
  }}
  loading="lazy"
  referrerPolicy="no-referrer"
  onError={() => setImgError(true)}
/>
    </div>
  );
}

export default StockLogo;


/* ─── USAGE ──────────────────────────────────────────────────────────────────

import StockLogo from "../ui/StockLogo";

// In WatchlistWidget row:
<StockLogo symbol={stock.symbol} name={stock.name} size={36} />

// In MarketMovers row:
<StockLogo symbol={stock.symbol} size={32} />

// In StockDetailsPage header:
<StockLogo symbol={symbol} size={48} className="rounded-2xl" />

// In WatchlistPage table:
<StockLogo symbol={row.symbol} size={28} />

────────────────────────────────────────────────────────────────────────── */