// client/src/components/ui/CompanyLogo.jsx
import { useState, useMemo } from "react";

// ─── Curated High-Resolution Corporate Logos for Indian Equities ───────────────
const CURATED_LOGOS = {
  RELIANCE: "https://upload.wikimedia.org/wikipedia/en/thumb/9/99/Reliance_Industries_Logo.svg/512px-Reliance_Industries_Logo.svg.png",
  TCS: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/512px-Tata_Consultancy_Services_Logo.svg.png",
  INFY: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/512px-Infosys_logo.svg.png",
  HDFCBANK: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/HDFC_Bank_Logo.svg/512px-HDFC_Bank_Logo.svg.png",
  ICICIBANK: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/512px-ICICI_Bank_Logo.svg.png",
  SBIN: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/SBI-logo.svg/512px-SBI-logo.svg.png",
  BHARTIARTL: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Airtel_logo.svg/512px-Airtel_logo.svg.png",
  ITC: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/ITC_Limited_Logo.svg/512px-ITC_Limited_Logo.svg.png",
  LT: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/L%26T.png/512px-L%26T.png",
  HINDUNILVR: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Hindustan_Unilever_Logo.svg/512px-Hindustan_Unilever_Logo.svg.png",
  TATAMOTORS: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tata_Motors_Logo.svg/512px-Tata_Motors_Logo.svg.png",
  MARUTI: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Maruti_Suzuki_logo.svg/512px-Maruti_Suzuki_logo.svg.png",
  WIPRO: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Wipro_Logo_RGB.svg/512px-Wipro_Logo_RGB.svg.png",
  BAJFINANCE: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bajaj_Finserv_Logo.svg/512px-Bajaj_Finserv_Logo.svg.png",
  TITAN: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Titan_Company_Logo.svg/512px-Titan_Company_Logo.svg.png",
  NTPC: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/NTPC_Logo.svg/512px-NTPC_Logo.svg.png",
  ONGC: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/ONGC_Logo.svg/512px-ONGC_Logo.svg.png",
  AXISBANK: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Axis_Bank_logo.svg/512px-Axis_Bank_logo.svg.png",
  KOTAKBANK: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Kotak_Mahindra_Bank_logo.svg/512px-Kotak_Mahindra_Bank_logo.svg.png",
  ADANIENT: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Adani_logo.svg/512px-Adani_logo.svg.png",
  SUNPHARMA: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Sun_Pharma_Logo.svg/512px-Sun_Pharma_Logo.svg.png",
  ZOMATO: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/512px-Zomato_logo.png",
  PAYTM: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png",
};

// ─── Clean Domain Mappings for Google 128px Favicons ─────────────────────────
const DOMAIN_MAP = {
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
  TECHM: "techmahindra.com",
  HCLTECH: "hcltech.com",
  NTPC: "ntpc.co.in",
  ONGC: "ongcindia.com",
  TATAMOTORS: "tatamotors.com",
  TATASTEEL: "tatasteel.com",
  TATAPOWER: "tatapower.com",
  SUNPHARMA: "sunpharma.com",
  BHARTIARTL: "airtel.in",
  ITC: "itcportal.com",
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
    const parts = name.replace(/limited|ltd|corp|corporation|bank|india/gi, "").trim().split(/\s+/);
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
 * 2. Curated High-Res Corporate SVG/PNG
 * 3. Tickertape CDN
 * 4. Google 128px Favicon via domain map
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

  // Ordered list of candidate image sources
  const candidateUrls = useMemo(() => {
    const urls = [];
    if (directSrc) urls.push(directSrc);
    if (CURATED_LOGOS[cleanTicker]) urls.push(CURATED_LOGOS[cleanTicker]);
    urls.push(`https://assets.tickertape.in/stock-logos/${cleanTicker}.png`);
    urls.push(`https://assets.tickertape.in/images/logos/${cleanTicker}.png`);

    const domain = DOMAIN_MAP[cleanTicker];
    if (domain) {
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    }

    return urls;
  }, [cleanTicker, directSrc]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

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
  const borderRadius = Math.max(8, Math.round(size * 0.26));
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
      className={`relative shrink-0 flex items-center justify-center overflow-hidden bg-white shadow-sm border border-white/20 select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius,
        padding: innerPad,
      }}
      title={`${finalName} (${cleanTicker})`}
    >
      <img
        src={currentUrl}
        alt={alt || `${cleanTicker} logo`}
        onError={handleImgError}
        className="w-full h-full object-contain filter drop-shadow-xs"
        loading="lazy"
        decoding="async"
        crossOrigin="anonymous"
      />
    </div>
  );
}
