import { useEffect, useState } from "react";
import { getPeerComparison } from "../../services/stockService";

const METRICS = [
  { key: "pulseScore", label: "PulseScore", better: "high", digits: 1 },
  { key: "trailingPE", label: "Trailing P/E", better: "low", digits: 1 },
  { key: "sectorMedianPE", label: "Sector Median P/E", better: "low", digits: 1 },
  { key: "priceToBook", label: "Price to Book", better: "low", digits: 2 },
  { key: "pegRatio", label: "PEG Ratio", better: "low", digits: 2 },
  { key: "roe", label: "ROE %", better: "high", digits: 1 },
  { key: "roce", label: "ROCE / ROA %", better: "high", digits: 1 },
  { key: "operatingMargin", label: "Operating Margin %", better: "high", digits: 1 },
  { key: "debtToEquity", label: "Debt to Equity", better: "low", digits: 2 },
  { key: "interestCoverage", label: "Interest Coverage", better: "high", digits: 1 },
  { key: "dividendYield", label: "Dividend Yield %", better: "high", digits: 2 },
  { key: "oneYearReturn", label: "1Y Return %", better: "high", digits: 1 },
  { key: "threeYearCagr", label: "3Y CAGR %", better: "high", digits: 1 },
];

function formatValue(value, digits) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(digits);
}

function leaders(peers, metric) {
  const values = peers
    .map((peer) => Number(peer[metric.key]))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return metric.better === "low" ? Math.min(...values) : Math.max(...values);
}

export default function PeerComparisonMatrix({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPeerComparison(symbol)
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [symbol]);

  const peers = data?.peers || [];

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0e1626] p-5 overflow-hidden">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-white">Peer Comparison</h2>
          <p className="text-xs text-gray-400 mt-1">{data?.industry || "Same-industry rivals"}</p>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">Loading sector rivals…</p>
      ) : peers.length < 2 ? (
        <p className="text-sm text-gray-400">Not enough published peers for this symbol yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                <th className="py-2 pr-3">Metric</th>
                {peers.map((peer) => (
                  <th key={peer.symbol} className="py-2 px-2 text-white font-extrabold">
                    {peer.symbol.replace(".NS", "")}
                    <span className="block text-[10px] text-amber-300 normal-case font-bold">{peer.pulseGrade || ""}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric) => {
                const best = leaders(peers, metric);
                return (
                  <tr key={metric.key} className="border-t border-white/5">
                    <td className="py-2 pr-3 text-gray-300">{metric.label}</td>
                    {peers.map((peer) => {
                      const value = peer[metric.key];
                      const isBest = best !== null && Number(value) === best;
                      return (
                        <td key={peer.symbol} className="py-2 px-2 font-mono text-white">
                          <span className={isBest ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-emerald-300" : ""}>
                            {formatValue(value, metric.digits)}
                            {isBest ? " Best" : ""}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
