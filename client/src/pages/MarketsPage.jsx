import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import CompanyLogo from "../components/ui/CompanyLogo";
import CuratedScreenersBar, { filterByPreset } from "../components/stocks/CuratedScreenersBar";
import { getCuratedScreeners } from "../services/stockService";
import SEO from "../components/common/SEO";
import Disclaimer from "../components/common/Disclaimer";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

export default function MarketsPage() {
  const [params, setParams] = useSearchParams();
  const preset = params.get("preset") || "";
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCuratedScreeners()
      .then((payload) => {
        if (active) setStocks(Array.isArray(payload?.stocks) ? payload.stocks : []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Could not load the screener universe");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = filterByPreset(stocks, preset);

  const choosePreset = (next) => {
    if (!next) setParams({});
    else setParams({ preset: next });
  };

  return (
    <AppLayout>
      <SEO
        title="NSE Stock Screeners & Market Discovery | StockPulse"
        description="Curated equity screeners for NSE stocks: High ROE compounders, Coffee Can portfolio candidates, undervalued value picks, and dividend stars."
        canonicalUrl="https://stockpulse.in/markets"
      />
      <div className="space-y-5 pb-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Discovery</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Curated Screeners</h1>
          <p className="text-sm text-gray-400 mt-1">Filters run on the loaded universe. The choice stays in the page address.</p>
        </div>

        <CuratedScreenersBar stocks={stocks} active={preset} onChange={choosePreset} />

        {loading ? (
          <div className="space-y-3">
            <Skeleton variant="card" height="56px" />
            <Skeleton variant="card" height="240px" />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-300">{error}</p>
        ) : (
          <div className="touch-scroll rounded-3xl border border-white/10 bg-[#0e1626]">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th>Pulse</th>
                  <th>P/E</th>
                  <th>ROE</th>
                  <th>D/E</th>
                  <th>Yield</th>
                  <th>RSI</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((stock) => (
                  <tr key={stock.symbol} className="border-t border-white/5">
                    <td className="px-4 py-3">
                      <Link to={`/stock/${stock.symbol.replace(".NS", "")}`} className="flex items-center gap-3">
                        <CompanyLogo symbol={stock.symbol.replace(".NS", "")} companyName={stock.name} size={32} />
                        <span>
                          <span className="block font-extrabold text-white">{stock.symbol.replace(".NS", "")}</span>
                          <span className="block text-[11px] text-gray-400">{stock.sector}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="font-mono text-amber-300">{stock.pulseScore ?? "—"}</td>
                    <td className="font-mono text-white">{stock.trailingPE ?? "—"}</td>
                    <td className="font-mono text-white">{stock.roe ?? "—"}</td>
                    <td className="font-mono text-white">{stock.debtToEquity ?? "—"}</td>
                    <td className="font-mono text-emerald-300">{stock.dividendYield ?? "—"}</td>
                    <td className="font-mono text-white">{stock.rsi ?? "—"}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-gray-400">No companies in this universe match that preset today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Disclaimer variant="full" className="mt-8" />
      </div>
    </AppLayout>
  );
}
