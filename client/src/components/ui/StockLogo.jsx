// client/src/components/ui/StockLogo.jsx
import { useState } from "react";

// ─── NSE Symbol → Company Domain mapping ─────────────────────────────────────
const SYMBOL_DOMAIN_MAP = {
  RELIANCE: "ril.com",
  TCS: "tcs.com",
  INFY: "infosys.com",
  HDFCBANK: "hdfcbank.com",
  ICICIBANK: "icicibank.com",
  SBIN: "sbi.co.in",
  BAJFINANCE: "bajajfinserv.in",
  WIPRO: "wipro.com",
  AXISBANK: "axisbank.com",
  LT: "larsentoubro.com",
  KOTAKBANK: "kotak.com",
  HINDUNILVR: "hul.co.in",
  MARUTI: "marutisuzuki.com",
  TITAN: "titancompany.in",
  NESTLEIND: "nestle.in",
  ASIANPAINT: "asianpaints.com",
  TECHM: "techmahindra.com",
  HCLTECH: "hcltech.com",
  ULTRACEMCO: "ultratechcement.com",
  POWERGRID: "powergridindia.com",
  NTPC: "ntpc.co.in",
  ONGC: "ongcindia.com",
  COALINDIA: "coalindia.in",
  TATAMOTORS: "tatamotors.com",
  TATASTEEL: "tatasteel.com",
  TATAPOWER: "tatapower.com",
  ADANIPORTS: "adaniports.com",
  ADANIENT: "adani.com",
  ADANIGREEN: "adanigreen.com",
  SUNPHARMA: "sunpharma.com",
  DRREDDY: "drreddys.com",
  CIPLA: "cipla.com",
  DIVISLAB: "divislaboratories.com",
  BHARTIARTL: "airtel.in",
  JIO: "jio.com",
  BAJAJFINSV: "bajajfinserv.in",
  HDFCLIFE: "hdfclife.com",
  SBILIFE: "sbilife.co.in",
  ICICIGI: "icicigi.com",
  INDUSINDBK: "indusind.com",
  FEDERALBNK: "federalbank.co.in",
  BANDHANBNK: "bandhanbank.com",
  IDFCFIRSTB: "idfcfirstbank.com",
  AUBANK: "aubank.in",
  YESBANK: "yesbank.in",
  PNB: "pnbindia.in",
  CANBK: "canarabank.com",
  BANKBARODA: "bankofbaroda.in",
  UNIONBANK: "unionbankofindia.co.in",
  GRASIM: "grasim.com",
  AMBUJACEM: "ambujacement.com",
  ACC: "acclimited.com",
  HEROMOTOCO: "heromotocorp.com",
  BAJAJ_AUTO: "bajajauto.com",
  EICHERMOT: "eichergroup.com",
  APOLLOHOSP: "apollohospitals.com",
  ZOMATO: "zomato.com",
  NYKAA: "nykaa.com",
  PAYTM: "paytm.com",
  POLICYBZR: "policybazaar.com",
  DMART: "dmart.in",
  TRENT: "trent.in",
  VEDL: "vedanta.com",
  HINDALCO: "hindalco.com",
  JSWSTEEL: "jsw.in",
  BPCL: "bharatpetroleum.com",
  IOC: "iocl.com",
  ITC: "itcportal.com",
  GODREJCP: "godrejcp.com",
  MARICO: "marico.com",
  DABUR: "dabur.com",
  BRITANNIA: "britannia.co.in",
  PIDILITIND: "pidilite.com",
  HAVELLS: "havells.com",
  SIEMENS: "siemens.co.in",
  ABB: "abb.co.in",
  BEL: "bel-india.in",
  HAL: "hal-india.co.in",
  IRFC: "irfc.nic.in",
  MUTHOOTFIN: "muthootfinance.com",
  LTIM: "ltimindtree.com",
  PERSISTENT: "persistent.com",
  TATAELXSI: "tataelxsi.com",
  IRCTC: "irctc.co.in",
  INDIGO: "goindigo.in",
};

const COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316",
];

function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return COLORS[Math.abs(h) % COLORS.length];
}

/**
 * Multi-tier StockLogo resolver:
 * 1. Google Favicon (domain mapped)
 * 2. Tickertape CDN
 * 3. Clearbit Logo
 * 4. Fallback Colored Initials
 */
function StockLogo({ symbol = "", name = "", size = 36, className = "" }) {
  const clean = (symbol || "").replace(".NS", "").replace(".BO", "").toUpperCase();
  const domain = SYMBOL_DOMAIN_MAP[clean];
  const [tier, setTier] = useState(0); // 0: Google, 1: Tickertape, 2: Clearbit, 3: Initials

  const initials = clean.slice(0, 2);
  const bgColor = hashColor(clean);
  const radius = Math.round(size * 0.28);

  // If no domain and not mapped, go straight to fallback
  if (!domain && tier === 0) {
    // try tickertape image first
    // setTier(1);
  }

  let src = null;
  if (tier === 0 && domain) {
    src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } else if (tier === 1) {
    src = `https://assets.tickertape.in/images/logos/${clean}.png`;
  } else if (tier === 2 && domain) {
    src = `https://logo.clearbit.com/${domain}`;
  }

  const handleImgError = () => {
    setTier((prev) => prev + 1);
  };

  if (!src || tier >= 3) {
    return (
      <div
        className={`flex items-center justify-center font-extrabold text-white shrink-0 shadow-md ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: `linear-gradient(135deg, ${bgColor}, #0b1120)`,
          fontSize: Math.max(10, Math.round(size * 0.36)),
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 overflow-hidden bg-white/95 border border-white/10 flex items-center justify-center shadow-md ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
      }}
    >
      <img
        src={src}
        alt={clean}
        width={Math.round(size * 0.75)}
        height={Math.round(size * 0.75)}
        style={{
          objectFit: "contain",
          maxHeight: "80%",
          maxWidth: "80%",
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={handleImgError}
      />
    </div>
  );
}

export default StockLogo;
