const PEER_GROUPS = [
  {
    industry: "Private Banks",
    symbols: ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS", "FEDERALBNK.NS"],
  },
  {
    industry: "PSU Banks",
    symbols: ["SBIN.NS", "BANKBARODA.NS", "PNB.NS", "CANBK.NS", "UNIONBANK.NS"],
  },
  {
    industry: "IT Services",
    symbols: ["TCS.NS", "INFY.NS", "HCLTECH.NS", "WIPRO.NS", "PERSISTENT.NS", "COFORGE.NS"],
  },
  {
    industry: "FMCG",
    symbols: ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS"],
  },
  {
    industry: "Automobiles",
    symbols: ["MARUTI.NS", "TATAMOTORS.NS", "M&M.NS", "BAJAJ-AUTO.NS", "EICHERMOT.NS", "HEROMOTOCO.NS"],
  },
  {
    industry: "Pharmaceuticals",
    symbols: ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "AUROPHARMA.NS"],
  },
  {
    industry: "Oil, Gas and Power",
    symbols: ["RELIANCE.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS", "BPCL.NS", "COALINDIA.NS"],
  },
  {
    industry: "NBFC",
    symbols: ["BAJFINANCE.NS", "BAJAJFINSV.NS", "CHOLAFIN.NS", "SHRIRAMFIN.NS", "MUTHOOTFIN.NS"],
  },
  {
    industry: "Telecom",
    symbols: ["BHARTIARTL.NS", "IDEA.NS", "INDUSTOWER.NS"],
  },
  {
    industry: "Metals",
    symbols: ["TATASTEEL.NS", "HINDALCO.NS", "JSWSTEEL.NS", "VEDL.NS"],
  },
  {
    industry: "Cement",
    symbols: ["ULTRACEMCO.NS", "GRASIM.NS", "SHREECEM.NS", "DALBHARAT.NS", "AMBUJACEM.NS"],
  },
  {
    industry: "Infrastructure",
    symbols: ["LT.NS", "ADANIPORTS.NS", "ADANIENT.NS", "SIEMENS.NS"],
  },
];

const SCREENER_UNIVERSE = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "BHARTIARTL.NS", "ICICIBANK.NS",
  "INFY.NS", "ITC.NS", "SBIN.NS", "LT.NS", "HINDUNILVR.NS",
  "BAJFINANCE.NS", "MARUTI.NS", "TITAN.NS", "SUNPHARMA.NS", "TATAMOTORS.NS",
  "NTPC.NS", "ONGC.NS", "AXISBANK.NS", "KOTAKBANK.NS", "HCLTECH.NS",
  "WIPRO.NS", "NESTLEIND.NS", "ASIANPAINT.NS", "ULTRACEMCO.NS", "POWERGRID.NS",
  "COALINDIA.NS", "BAJAJ-AUTO.NS", "CIPLA.NS", "DRREDDY.NS", "DIVISLAB.NS",
  "TATASTEEL.NS", "HINDALCO.NS", "BRITANNIA.NS", "EICHERMOT.NS", "PIDILITIND.NS",
  "PERSISTENT.NS", "COFORGE.NS", "POLYCAB.NS", "DIXON.NS", "AUROPHARMA.NS",
  "BPCL.NS", "GRASIM.NS", "ADANIENT.NS", "M&M.NS", "HEROMOTOCO.NS",
];

function findPeerGroup(symbol) {
  const target = String(symbol || "").toUpperCase();
  return PEER_GROUPS.find((group) => group.symbols.includes(target)) || null;
}

module.exports = {
  PEER_GROUPS,
  SCREENER_UNIVERSE,
  findPeerGroup,
};
