import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Bell,
  Pencil,
  Plus,
  Search,
  Upload,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import CompanyLogo from "../components/ui/CompanyLogo";
import CreateAlertModal from "../components/alerts/CreateAlertModal";
import {
  addHolding,
  deleteHolding,
  getPortfolio,
  updateHolding,
} from "../services/portfolioService";
import BrokerImportModal from "../components/portfolio/BrokerImportModal";
import SectorAllocationDonut from "../components/portfolio/SectorAllocationDonut";
import DividendCashflowWidget from "../components/portfolio/DividendCashflowWidget";
import { getLiveStocks, searchStocks } from "../services/stockService";
import toast from "react-hot-toast";

function cleanSymbol(sym = "") {
  return sym.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function formatINR(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function signedINR(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const num = Number(value);
  const prefix = num > 0 ? "+" : "";
  return `${prefix}${formatINR(num)}`;
}

function todayInputValue(date) {
  const d = date ? new Date(date) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  symbol: "",
  companyName: "",
  quantity: "",
  avgBuyPrice: "",
  buyDate: todayInputValue(),
  notes: "",
  ltp: null,
};

const BROKERS = [
  { name: "Zerodha Kite", mark: "Z", tone: "from-blue-500 to-orange-400" },
  { name: "Groww", mark: "G", tone: "from-emerald-400 to-green-600" },
  { name: "Upstox", mark: "U", tone: "from-violet-400 to-fuchsia-500" },
];

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [alertStock, setAlertStock] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const loadPortfolio = async () => {
    try {
      const data = await getPortfolio();
      setHoldings(Array.isArray(data?.holdings) ? data.holdings : []);
      setSummary(data?.summary || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load portfolio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (!modalOpen || editing) return undefined;
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await searchStocks(trimmed);
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, modalOpen, editing]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, buyDate: todayInputValue() });
    setQuery("");
    setResults([]);
    setModalOpen(true);
  };

  const openEdit = (holding) => {
    setEditing(holding);
    setForm({
      symbol: holding.symbol,
      companyName: holding.companyName || "",
      quantity: String(holding.quantity),
      avgBuyPrice: String(holding.avgBuyPrice),
      buyDate: todayInputValue(holding.buyDate),
      notes: holding.notes || "",
      ltp: holding.livePrice,
    });
    setModalOpen(true);
  };

  const selectStock = async (stock) => {
    const symbol = stock.symbol?.includes(".") ? stock.symbol : `${stock.symbol}.NS`;
    setForm((prev) => ({
      ...prev,
      symbol,
      companyName: stock.name || stock.companyName || cleanSymbol(symbol),
    }));
    setQuery(cleanSymbol(symbol));
    setResults([]);
    try {
      const live = await getLiveStocks([symbol]);
      const price = Array.isArray(live) && live[0]?.price ? Number(live[0].price) : null;
      if (price) {
        setForm((prev) => ({
          ...prev,
          symbol,
          companyName: stock.name || prev.companyName,
          ltp: price,
          avgBuyPrice: prev.avgBuyPrice || price.toFixed(2),
        }));
      }
    } catch {
      toast.error("Live price is unavailable. Enter the average buy price manually.");
    }
  };

  const submitHolding = async (event) => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const avgBuyPrice = Number(form.avgBuyPrice);

    if (!editing && !form.symbol) {
      toast.error("Search and select an NSE stock");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 0.01) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (!Number.isFinite(avgBuyPrice) || avgBuyPrice < 0.01) {
      toast.error("Average buy price must be positive");
      return;
    }

    try {
      setSaving(true);
      if (editing) {
        await updateHolding(editing._id, {
          quantity,
          avgBuyPrice,
          notes: form.notes,
        });
        toast.success(`${cleanSymbol(editing.symbol)} holding updated`);
      } else {
        const result = await addHolding({
          symbol: form.symbol,
          companyName: form.companyName,
          quantity,
          avgBuyPrice,
          buyDate: form.buyDate,
          notes: form.notes,
          broker: "Manual",
        });
        toast.success(
          result?.merged
            ? `${cleanSymbol(form.symbol)} quantity averaged into your existing holding`
            : `${cleanSymbol(form.symbol)} added to your portfolio`
        );
      }
      setModalOpen(false);
      await loadPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save holding");
    } finally {
      setSaving(false);
    }
  };

  const removeHolding = async (holding) => {
    const label = cleanSymbol(holding.symbol);
    if (!window.confirm(`Remove ${label} from your portfolio?`)) return;
    try {
      await deleteHolding(holding._id);
      toast.success(`${label} removed`);
      await loadPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove holding");
    }
  };

  const pnlPositive = (summary?.totalPnL || 0) >= 0;
  const dayPositive = (summary?.todayPnL || 0) >= 0;
  const score = summary?.portfolioPulseScore;

  const cards = useMemo(
    () => [
      {
        label: "Total Portfolio Value",
        value: formatINR(summary?.totalCurrentValue),
        hint: `${dayPositive ? "+" : ""}${formatINR(summary?.todayPnL || 0)} today`,
        hintClass: dayPositive ? "text-emerald-400" : "text-rose-400",
      },
      {
        label: "Total Invested Capital",
        value: formatINR(summary?.totalInvested),
        hint: `${summary?.holdingsCount || 0} holdings`,
        hintClass: "text-gray-400",
      },
      {
        label: "Overall Return",
        value: signedINR(summary?.totalPnL),
        hint: `${pnlPositive ? "+" : ""}${Number(summary?.totalPnLPct || 0).toFixed(2)}%`,
        hintClass: pnlPositive ? "text-emerald-400" : "text-rose-400",
        badge: true,
      },
      {
        label: "Portfolio Quality Score",
        value: score === null || score === undefined ? "—" : `${score}`,
        hint: summary?.portfolioGrade
          ? `Grade ${summary.portfolioGrade}${summary.diversificationPenalty ? ` · -${summary.diversificationPenalty} concentration` : ""}`
          : "Add holdings to score the book",
        hintClass: "text-amber-300",
      },
    ],
    [summary, dayPositive, pnlPositive, score]
  );

  return (
    <AppLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">Holdings</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
              <Activity size={22} className="text-amber-400" />
              Personal Portfolio
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Quantity, average price, live P&amp;L, and a value-weighted PulseScore.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <Upload size={16} /> Import CSV
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="h-11 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Stock Holding
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-[#0e1626] p-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-500">{card.label}</p>
              <p className="text-2xl font-black text-white font-mono mt-2">{card.value}</p>
              <p className={`text-xs font-bold mt-2 ${card.hintClass}`}>
                {card.badge ? (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full border ${
                      pnlPositive
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {card.hint}
                  </span>
                ) : (
                  card.hint
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectorAllocationDonut sectors={summary?.sectors || []} alerts={summary?.concentrationAlerts || []} />
          <DividendCashflowWidget summary={summary} />
        </div>

        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-[#0e1626] to-[#0e1626] p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Wallet size={16} className="text-amber-300" />
                <h2 className="text-sm font-extrabold text-white">Connect Your Broker</h2>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/30">
                  Direct Broker API Sync (Coming Soon)
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Holdings are manual today. Broker sync will pull quantity and average price automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {BROKERS.map((broker) => (
                <div
                  key={broker.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#080d18] border border-white/10"
                >
                  <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${broker.tone} text-black text-xs font-black flex items-center justify-center`}>
                    {broker.mark}
                  </span>
                  <span className="text-xs font-bold text-white">{broker.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0e1626] overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-gray-400">Loading holdings…</div>
          ) : holdings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-white font-bold">No holdings yet</p>
              <p className="text-xs text-gray-400 mt-1">Add a stock with quantity and average buy price to track live P&amp;L.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-bold">Company</th>
                    <th className="px-4 py-3 font-bold">Shares</th>
                    <th className="px-4 py-3 font-bold">Avg vs Live</th>
                    <th className="px-4 py-3 font-bold">Invested</th>
                    <th className="px-4 py-3 font-bold">Current</th>
                    <th className="px-4 py-3 font-bold">Unrealized P&amp;L</th>
                    <th className="px-4 py-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => {
                    const up = (holding.unrealizedPnL || 0) >= 0;
                    return (
                      <tr key={holding._id} className="border-b border-white/[0.05] align-middle">
                        <td className="px-4 py-3">
                          <Link to={`/stock/${cleanSymbol(holding.symbol)}`} className="flex items-center gap-3">
                            <CompanyLogo symbol={cleanSymbol(holding.symbol)} companyName={holding.companyName} size={36} />
                            <div>
                              <p className="text-sm font-extrabold text-white">{cleanSymbol(holding.symbol)}</p>
                              <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{holding.companyName}</p>
                              {holding.pulseScore !== null && (
                                <p className="text-[10px] font-bold text-amber-300 mt-0.5">
                                  Pulse {holding.pulseScore} · {holding.pulseGrade}
                                </p>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-white">{holding.quantity}</td>
                        <td className="px-4 py-3 text-xs font-mono">
                          <p className="text-gray-400">{formatINR(holding.avgBuyPrice)}</p>
                          <p className="text-white font-bold">{formatINR(holding.livePrice)}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-white">{formatINR(holding.investedValue)}</td>
                        <td className="px-4 py-3 text-sm font-mono text-white">{formatINR(holding.currentValue)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-extrabold px-2 py-1 rounded-full border ${
                              holding.unrealizedPnL === null
                                ? "text-gray-400 border-white/10"
                                : up
                                ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/30"
                                : "text-rose-300 bg-rose-500/15 border-rose-500/30"
                            }`}
                          >
                            {holding.unrealizedPnL !== null && (up ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
                            {signedINR(holding.unrealizedPnL)}
                            {holding.unrealizedPnLPct !== null && ` (${up ? "+" : ""}${holding.unrealizedPnLPct}%)`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => openEdit(holding)} className="w-8 h-8 rounded-lg bg-white/5 text-gray-300 hover:text-white" title="Edit">
                              <Pencil size={14} className="mx-auto" />
                            </button>
                            <button type="button" onClick={() => removeHolding(holding)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-300" title="Delete">
                              <Trash2 size={14} className="mx-auto" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAlertStock({
                                  symbol: holding.symbol,
                                  price: holding.livePrice,
                                  name: holding.companyName,
                                })
                              }
                              className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-300"
                              title="Set Price Alert"
                            >
                              <Bell size={14} className="mx-auto" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="mobile-sheet fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close" onClick={() => setModalOpen(false)} />
          <form onSubmit={submitHolding} className="mobile-sheet-panel relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0e1422] border border-white/10 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-white">{editing ? "Edit Holding" : "Add Stock Holding"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 text-gray-300">
                <X size={16} className="mx-auto" />
              </button>
            </div>

            {!editing && (
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-3 text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search NSE stocks"
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#080d18] border border-white/10 text-sm text-white outline-none"
                />
                {(searching || results.length > 0) && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-white/10 bg-[#0b1120]">
                    {searching && <p className="px-3 py-2 text-xs text-gray-400">Searching…</p>}
                    {results.map((stock) => (
                      <button
                        type="button"
                        key={stock.symbol}
                        onClick={() => selectStock(stock)}
                        className="w-full text-left px-3 py-2 hover:bg-white/5"
                      >
                        <span className="text-xs font-bold text-white">{cleanSymbol(stock.symbol)}</span>
                        <span className="block text-[11px] text-gray-400">{stock.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="text-[11px] text-gray-400 font-bold col-span-2">
                Symbol
                <input value={cleanSymbol(form.symbol)} readOnly className="mt-1 w-full h-10 px-3 rounded-xl bg-[#080d18] border border-white/10 text-sm text-white" />
              </label>
              <label className="text-[11px] text-gray-400 font-bold">
                Quantity
                <input
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="10"
                  inputMode="decimal"
                  className="mt-1 w-full h-10 px-3 rounded-xl bg-[#080d18] border border-white/10 text-sm text-white"
                />
              </label>
              <label className="text-[11px] text-gray-400 font-bold">
                Average Buy Price
                <input
                  value={form.avgBuyPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, avgBuyPrice: e.target.value }))}
                  placeholder="234.00"
                  inputMode="decimal"
                  className="mt-1 w-full h-10 px-3 rounded-xl bg-[#080d18] border border-white/10 text-sm text-white"
                />
              </label>
              <label className="text-[11px] text-gray-400 font-bold">
                Purchase Date
                <input
                  type="date"
                  value={form.buyDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, buyDate: e.target.value }))}
                  className="mt-1 w-full h-10 px-3 rounded-xl bg-[#080d18] border border-white/10 text-sm text-white"
                />
              </label>
              <label className="text-[11px] text-gray-400 font-bold">
                Live LTP
                <input value={form.ltp ? formatINR(form.ltp) : "—"} readOnly className="mt-1 w-full h-10 px-3 rounded-xl bg-[#080d18] border border-white/10 text-sm text-emerald-300" />
              </label>
              <label className="text-[11px] text-gray-400 font-bold col-span-2">
                Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-[#080d18] border border-white/10 text-sm text-white"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full h-11 rounded-xl bg-emerald-500 text-black text-xs font-extrabold disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Update Holding" : "Save Holding"}
            </button>
          </form>
        </div>
      )}

      <CreateAlertModal open={Boolean(alertStock)} onClose={() => setAlertStock(null)} stock={alertStock || {}} />
      <BrokerImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(result) => {
          if (Array.isArray(result?.holdings)) {
            setHoldings(result.holdings);
            setSummary(result.summary || null);
          } else {
            loadPortfolio();
          }
        }}
      />
    </AppLayout>
  );
}
