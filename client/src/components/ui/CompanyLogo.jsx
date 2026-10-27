// client/src/components/ui/CompanyLogo.jsx
import { useState, useMemo, useEffect } from "react";

// ─── Official High-Resolution Vector SVGs (TradingView & Groww CDN) ───────────
// Verified HTTP 200 OK — Vector SVGs provide infinite resolution on all screen densities
const HIGH_RES_LOGOS = {
  // NIFTY 50 / Large Cap Bluechips
  RELIANCE: "https://s3-symbol-logo.tradingview.com/reliance--big.svg",
  TCS: "https://s3-symbol-logo.tradingview.com/tata-consultancy--big.svg",
  INFY: "https://s3-symbol-logo.tradingview.com/infosys--big.svg",
  HDFCBANK: "https://s3-symbol-logo.tradingview.com/hdfc-bank--big.svg",
  ICICIBANK: "https://s3-symbol-logo.tradingview.com/icici-bank--big.svg",
  SBIN: "https://s3-symbol-logo.tradingview.com/state-bank--big.svg",
  BHARTIARTL: "https://s3-symbol-logo.tradingview.com/airtel--big.svg",
  ITC: "https://s3-symbol-logo.tradingview.com/itc--big.svg",
  LT: "https://s3-symbol-logo.tradingview.com/larsen-and-toubro--big.svg",
  HINDUNILVR: "https://s3-symbol-logo.tradingview.com/unilever--big.svg",
  BAJFINANCE: "https://s3-symbol-logo.tradingview.com/bajaj-finance--big.svg",
  BAJAJFINSV: "https://s3-symbol-logo.tradingview.com/bajaj-finserv--big.svg",
  MARUTI: "https://s3-symbol-logo.tradingview.com/maruti-suzuki-india--big.svg",
  TITAN: "https://s3-symbol-logo.tradingview.com/titan-company--big.svg",
  SUNPHARMA: "https://s3-symbol-logo.tradingview.com/sun-pharmaceutical--big.svg",
  TATAMOTORS: "https://s3-symbol-logo.tradingview.com/tata-motors--big.svg",
  TATASTEEL: "https://s3-symbol-logo.tradingview.com/tata-steel--big.svg",
  TATAPOWER: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK500400.png",
  NTPC: "https://s3-symbol-logo.tradingview.com/ntpc--big.svg",
  ONGC: "https://s3-symbol-logo.tradingview.com/oil-and-natural-gas--big.svg",
  AXISBANK: "https://s3-symbol-logo.tradingview.com/axis-bank--big.svg",
  KOTAKBANK: "https://s3-symbol-logo.tradingview.com/kotak-mahindra-bank--big.svg",
  ADANIENT: "https://s3-symbol-logo.tradingview.com/adani--big.svg",
  ADANIPORTS: "https://s3-symbol-logo.tradingview.com/adani-ports--big.svg",
  ADANIPOWER: "https://s3-symbol-logo.tradingview.com/adani-power--big.svg",
  WIPRO: "https://s3-symbol-logo.tradingview.com/wipro--big.svg",
  HCLTECH: "https://s3-symbol-logo.tradingview.com/hcl-technologies--big.svg",
  ASIANPAINT: "https://s3-symbol-logo.tradingview.com/asian-paints--big.svg",
  ULTRACEMCO: "https://s3-symbol-logo.tradingview.com/ultratech-cement--big.svg",
  COALINDIA: "https://s3-symbol-logo.tradingview.com/coal-india--big.svg",
  CIPLA: "https://s3-symbol-logo.tradingview.com/cipla--big.svg",
  EICHERMOT: "https://s3-symbol-logo.tradingview.com/eicher-motors--big.svg",
  APOLLOHOSP: "https://s3-symbol-logo.tradingview.com/apollo-hospitals--big.svg",
  HEROMOTOCO: "https://s3-symbol-logo.tradingview.com/hero-motocorp--big.svg",
  BPCL: "https://s3-symbol-logo.tradingview.com/bharat-petroleum--big.svg",
  IOC: "https://s3-symbol-logo.tradingview.com/indian-oil--big.svg",
  VEDL: "https://s3-symbol-logo.tradingview.com/vedanta--big.svg",
  INDUSINDBK: "https://s3-symbol-logo.tradingview.com/indusind-bank--big.svg",
  ZOMATO: "https://s3-symbol-logo.tradingview.com/zomato--big.svg",
  PAYTM: "https://s3-symbol-logo.tradingview.com/one-97-communications--big.svg",

  // Mid Cap Growth Leaders
  POLYCAB: "https://s3-symbol-logo.tradingview.com/polycab--big.svg",
  PERSISTENT: "https://s3-symbol-logo.tradingview.com/persistent-systems--big.svg",
  ASHOKLEY: "https://s3-symbol-logo.tradingview.com/ashok-leyland--big.svg",
  VOLTAS: "https://s3-symbol-logo.tradingview.com/voltas--big.svg",
  JUBLFOOD: "https://s3-symbol-logo.tradingview.com/jubilant-foodworks--big.svg",
  CUMMINSIND: "https://s3-symbol-logo.tradingview.com/cummins--big.svg",
  IDFCFIRSTB: "https://s3-symbol-logo.tradingview.com/idfc-first-bank--big.svg",
  BHARATFORG: "https://s3-symbol-logo.tradingview.com/bharat-forge--big.svg",
  MRF: "https://s3-symbol-logo.tradingview.com/mrf--big.svg",
  PAGEIND: "https://s3-symbol-logo.tradingview.com/page-industries--big.svg",
  FEDERALBNK: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK500469.png",
  COFORGE: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK532541.png",
  ASTRAL: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK532830.png",
  DIXON: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK540699.png",

  // Small Cap & Emerging Market Movers
  SUZLON: "https://s3-symbol-logo.tradingview.com/suzlon-energy--big.svg",
  KEC: "https://s3-symbol-logo.tradingview.com/kec-international--big.svg",
  TRIDENT: "https://s3-symbol-logo.tradingview.com/trident--big.svg",
  ANGELONE: "https://s3-symbol-logo.tradingview.com/angel-broking--big.svg",
  BSELTD: "https://s3-symbol-logo.tradingview.com/bse--big.svg",
  SONATSOFTW: "https://s3-symbol-logo.tradingview.com/sonata-software--big.svg",
  CENTRALBK: "https://s3-symbol-logo.tradingview.com/central-bank-of-india--big.svg",
  RAILTEL: "https://s3-symbol-logo.tradingview.com/railtel--big.svg",
  CEAT: "https://s3-symbol-logo.tradingview.com/ceat--big.svg",
  ROUTE: "https://s3-symbol-logo.tradingview.com/route-mobile--big.svg",
  RADICO: "https://s3-symbol-logo.tradingview.com/radico-khaitan--big.svg",
  LEMONTREE: "https://s3-symbol-logo.tradingview.com/lemon-tree-hotels--big.svg",
  CASTROLIND: "https://s3-symbol-logo.tradingview.com/castrol-india--big.svg",
  AMBER: "https://s3-symbol-logo.tradingview.com/amber-enterprises-india--big.svg",
  CLEAN: "https://s3-symbol-logo.tradingview.com/clean-science-and-technology--big.svg",
  HFCL: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK500186.png",
  HAPPSTMNDS: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK543227.png",
  TANLA: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK532790.png",
  CDSL: "https://assets-netstorage.groww.in/stock-assets/logos/GSTK542651.png",
};

// ─── Domain Mapping for Non-Curated Equities ─────────────────────────────────
const DOMAIN_MAP = {
  DRREDDY: "drreddys.com",
  DIVISLAB: "divislaboratories.com",
  GRASIM: "grasim.com",
  BAJAJ_AUTO: "bajajauto.com",
  MAXHEALTH: "maxhealthcare.in",
  TATACOMM: "tatacommunications.com",
  DALBHARAT: "dalmiabharat.com",
  AUROPHARMA: "aurobindo.com",
  CONCOR: "concorindia.co.in",
  ESCORTS: "escortsgroup.com",
  LTIM: "ltimindtree.com",
  TATAELXSI: "tataelxsi.com",
  MUTHOOTFIN: "muthootfinance.com",
  IRCTC: "irctc.co.in",
  INDIGO: "goindigo.in",
  BEL: "bel-india.in",
  HAL: "hal-india.co.in",
  SIEMENS: "siemens.co.in",
  ABB: "abb.co.in",
  HAVELLS: "havells.com",
  PIDILITIND: "pidilite.com",
  BRITANNIA: "britannia.co.in",
  DABUR: "dabur.com",
  MARICO: "marico.com",
  GODREJCP: "godrejcp.com",
  NYKAA: "nykaa.com",
  DMART: "dmart.in",
  TRENT: "trent.in",
  POLICYBZR: "policybazaar.com",
  IRFC: "irfc.nic.in",
};

const GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-blue-500 to-indigo-700",
  "from-violet-500 to-purple-800",
  "from-amber-500 to-orange-700",
  "from-cyan-500 to-blue-700",
  "from-rose-500 to-pink-700",
  "from-teal-500 to-emerald-800",
];

function getInitials(name = "", symbol = "") {
  if (name && name.length > 2 && !name.includes(".NS")) {
    const parts = name
      .replace(/limited|ltd|corp|corporation|bank|india/gi, "")
      .trim()
      .split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
  }
  const cleanSym = (symbol || "").replace(".NS", "").replace(".BO", "").trim();
  return cleanSym.slice(0, 2).toUpperCase() || "ST";
}

function hashString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Reusable CompanyLogo component
 * Multi-Tier Resolution:
 * 1. Explicit `logoSource` / `src` prop
 * 2. Official TradingView SVG / Groww 200px PNG (Infinitely sharp vectors)
 * 3. Unavatar vector CDN (`unavatar.io/${domain}?fallback=false`)
 * 4. Google 128px high-res favicon (`sz=128`)
 * 5. Deterministic Initials Badge
 */
export default function CompanyLogo({
  companyName = "",
  name = "",
  ticker = "",
  symbol = "",
  logoSource = "",
  src = "",
  size = 40,
  className = "",
  alt = "",
}) {
  const finalSymbol = (ticker || symbol || "").toUpperCase();
  const cleanTicker = finalSymbol.replace(".NS", "").replace(".BO", "").trim();
  const finalName = companyName || name || cleanTicker;
  const directSrc = logoSource || src;

  // Build candidate URL list
  const candidateUrls = useMemo(() => {
    const urls = [];
    if (directSrc) urls.push(directSrc);

    // 1. Check official vector SVG / Groww PNG map
    if (HIGH_RES_LOGOS[cleanTicker]) {
      urls.push(HIGH_RES_LOGOS[cleanTicker]);
    }

    // 2. Secondary domain-based lookups
    const domain = DOMAIN_MAP[cleanTicker] || (cleanTicker ? `${cleanTicker.toLowerCase()}.com` : null);
    if (domain) {
      urls.push(`https://unavatar.io/${domain}?fallback=false`);
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      urls.push(`https://logo.clearbit.com/${domain}`);
    }

    return urls;
  }, [cleanTicker, directSrc]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // Reset when ticker or direct source changes
  useEffect(() => {
    setCandidateIndex(0);
    setHasFailedAll(false);
  }, [cleanTicker, directSrc]);

  const currentUrl = candidateUrls[candidateIndex];

  const handleImgError = () => {
    if (candidateIndex < candidateUrls.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const initials = useMemo(() => getInitials(finalName, cleanTicker), [finalName, cleanTicker]);
  const gradientClass = GRADIENTS[hashString(cleanTicker) % GRADIENTS.length];
  const borderRadius = Math.max(8, Math.round(size * 0.28));

  // If no URL loaded or all candidates failed -> Crisp Initials Badge
  if (hasFailedAll || !currentUrl) {
    return (
      <div
        className={`flex items-center justify-center font-black text-white shrink-0 shadow-sm select-none bg-gradient-to-br ${gradientClass} ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius,
          fontSize: Math.max(10, Math.round(size * 0.38)),
          letterSpacing: "-0.03em",
        }}
        title={`${finalName} (${cleanTicker})`}
      >
        {initials}
      </div>
    );
  }

  // Is this an official TradingView full-bleed SVG?
  const isTradingViewSvg = typeof currentUrl === "string" && currentUrl.includes("tradingview.com");

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden select-none border border-white/10 shadow-xs ${
        isTradingViewSvg ? "bg-transparent" : "bg-white"
      } ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius,
        padding: isTradingViewSvg ? 0 : Math.max(2, Math.round(size * 0.08)),
      }}
      title={`${finalName} (${cleanTicker})`}
    >
      <img
        key={`${cleanTicker}-${candidateIndex}`}
        src={currentUrl}
        alt={alt || `${cleanTicker} logo`}
        onError={handleImgError}
        className={`w-full h-full ${isTradingViewSvg ? "object-cover" : "object-contain"}`}
        style={{ imageRendering: "auto" }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
