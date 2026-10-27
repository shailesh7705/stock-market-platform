// client/src/components/ui/CompanyLogo.jsx
import { useState, useMemo, useEffect } from "react";

// ─── Comprehensive Domain Mapping for Top Indian Equities (NSE/BSE) ───────────
const DOMAIN_MAP = {
  // NIFTY 50 / Large Cap
  RELIANCE: "ril.com",
  TCS: "tcs.com",
  INFY: "infosys.com",
  HDFCBANK: "hdfcbank.com",
  ICICIBANK: "icicibank.com",
  SBIN: "sbi.co.in",
  BHARTIARTL: "airtel.in",
  ITC: "itcportal.com",
  LT: "larsentoubro.com",
  HINDUNILVR: "hul.co.in",
  BAJFINANCE: "bajajfinserv.in",
  BAJAJFINSV: "bajajfinserv.in",
  MARUTI: "marutisuzuki.com",
  TITAN: "titancompany.in",
  SUNPHARMA: "sunpharma.com",
  TATAMOTORS: "tatamotors.com",
  TATASTEEL: "tatasteel.com",
  TATAPOWER: "tatapower.com",
  NTPC: "ntpc.co.in",
  ONGC: "ongcindia.com",
  AXISBANK: "axisbank.com",
  KOTAKBANK: "kotak.com",
  ADANIENT: "adani.com",
  ADANIPORTS: "adaniports.com",
  ADANIGREEN: "adanigreen.com",
  WIPRO: "wipro.com",
  HCLTECH: "hcltech.com",
  TECHM: "techmahindra.com",
  NESTLEIND: "nestle.in",
  ASIANPAINT: "asianpaints.com",
  ULTRACEMCO: "ultratechcement.com",
  POWERGRID: "powergridindia.com",
  COALINDIA: "coalindia.in",
  DRREDDY: "drreddys.com",
  CIPLA: "cipla.com",
  DIVISLAB: "divislaboratories.com",
  BPCL: "bharatpetroleum.com",
  IOC: "iocl.com",
  GRASIM: "grasim.com",
  HEROMOTOCO: "heromotocorp.com",
  BAJAJ_AUTO: "bajajauto.com",
  EICHERMOT: "eichergroup.com",
  APOLLOHOSP: "apollohospitals.com",
  JSWSTEEL: "jsw.in",
  HINDALCO: "hindalco.com",
  VEDL: "vedanta.com",
  INDUSINDBK: "indusind.com",

  // Mid Cap
  POLYCAB: "polycab.com",
  PERSISTENT: "persistent.com",
  COFORGE: "coforge.com",
  FEDERALBNK: "federalbank.co.in",
  ASHOKLEY: "ashokleyland.com",
  ASTRAL: "astralpipes.com",
  VOLTAS: "voltas.com",
  JUBLFOOD: "jubilantfoodworks.com",
  MAXHEALTH: "maxhealthcare.in",
  DIXON: "dixoninfo.com",
  CUMMINSIND: "cumminsindia.com",
  IDFCFIRSTB: "idfcfirstbank.com",
  BHARATFORG: "bharatforge.com",
  MRF: "mrftyres.com",
  PAGEIND: "pageindustries.com",
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

  // Small Cap & Digital
  CDSL: "cdslindia.com",
  SUZLON: "suzlon.com",
  KEC: "kecrpg.com",
  TRIDENT: "tridentindia.com",
  HFCL: "hfcl.com",
  CLEAN: "cleanscience.co.in",
  HAPPSTMNDS: "happiestminds.com",
  CASTROLIND: "castrol.com",
  ANGELONE: "angelone.in",
  BSELTD: "bseindia.com",
  AMBER: "ambergroupindia.com",
  SONATSOFTW: "sonata-software.com",
  TANLA: "tanla.com",
  CENTRALBK: "centralbankofindia.co.in",
  RAILTEL: "railtelindia.com",
  CEAT: "ceat.com",
  ZOMATO: "zomato.com",
  PAYTM: "paytm.com",
  NYKAA: "nykaa.com",
  DMART: "dmart.in",
  TRENT: "trent.in",
  POLICYBZR: "policybazaar.com",
  IRFC: "irfc.nic.in",
  ROUTE: "routemobile.com",
  RADICO: "radicokhaitan.com",
  LEMONTREE: "lemontreehotels.com",
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
 * Accepts company name, ticker symbol, and optional logo source.
 * Multi-tier resolution:
 * 1. Explicit `logoSource` / `src` prop
 * 2. Unavatar official vector/high-res CDN (`https://unavatar.io/${domain}?fallback=false`)
 * 3. Google 128px High-Res Favicon (`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)
 * 4. Clearbit Logo CDN (`https://logo.clearbit.com/${domain}`)
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

  // Build candidate URL list based on domain mapping
  const candidateUrls = useMemo(() => {
    const urls = [];
    if (directSrc) urls.push(directSrc);

    const domain = DOMAIN_MAP[cleanTicker] || (cleanTicker ? `${cleanTicker.toLowerCase()}.com` : null);
    if (domain) {
      // 1. Unavatar returns crisp SVG / high-res PNG for top companies
      urls.push(`https://unavatar.io/${domain}?fallback=false`);
      // 2. Google Favicon (128px high resolution)
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      // 3. Clearbit CDN
      urls.push(`https://logo.clearbit.com/${domain}`);
    }

    return urls;
  }, [cleanTicker, directSrc]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // Reset when symbol changes
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
  const innerPad = Math.max(3, Math.round(size * 0.12));

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

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden bg-white shadow-xs border border-white/20 select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius,
        padding: innerPad,
      }}
      title={`${finalName} (${cleanTicker})`}
    >
      <img
        key={`${cleanTicker}-${candidateIndex}`}
        src={currentUrl}
        alt={alt || `${cleanTicker} logo`}
        onError={handleImgError}
        className="w-full h-full object-contain filter drop-shadow-xs"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
