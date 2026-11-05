import { useMemo, useState } from "react";
import { Upload, X } from "lucide-react";
import { parseBrokerCsv } from "../../utils/brokerCsv";
import { bulkImportHoldings } from "../../services/portfolioService";
import toast from "react-hot-toast";

export default function BrokerImportModal({ open, onClose, onImported }) {
  const [broker, setBroker] = useState("CSV");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => rows.filter((row) => row.include && row.flags.length === 0),
    [rows]
  );

  if (!open) return null;

  const loadFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseBrokerCsv(text);
    setBroker(parsed.broker);
    setRows(parsed.rows);
    setError(parsed.error || "");
  };

  const updateRow = (id, patch) => {
    setRows((current) => current.map((row) => {
      if (row.id !== id) return row;
      const next = { ...row, ...patch };
      const flags = [];
      if (!next.symbol) flags.push("Missing symbol");
      if (Number(next.quantity) < 0.01) flags.push("Quantity must be at least 0.01");
      if (Number(next.avgBuyPrice) < 0.01) flags.push("Average price must be positive");
      next.flags = flags;
      if (flags.length) next.include = false;
      return next;
    }));
  };

  const confirmImport = async () => {
    if (!selected.length) {
      toast.error("Select at least one valid row");
      return;
    }
    try {
      setSaving(true);
      const result = await bulkImportHoldings({
        broker,
        holdings: selected.map((row) => ({
          symbol: row.symbol,
          companyName: row.companyName,
          quantity: Number(row.quantity),
          avgBuyPrice: Number(row.avgBuyPrice),
          buyDate: row.buyDate || undefined,
        })),
      });
      toast.success(`${result.imported || selected.length} holdings imported`);
      onImported(result);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close import" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-[#0e1422] border border-white/10 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-extrabold text-white">Import broker holdings</h2>
            <p className="text-xs text-gray-400 mt-1">Zerodha Console or Groww CSV. Review every row before it is saved.</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 text-gray-300">
            <X size={16} className="mx-auto" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <label
            className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-100 cursor-pointer"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              loadFile(event.dataTransfer.files?.[0]);
            }}
          >
            <Upload size={18} />
            <span className="text-xs font-bold">Drop a CSV here or click to browse</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => loadFile(event.target.files?.[0])}
            />
          </label>

          {error && <p className="text-xs text-rose-300 mt-3">{error}</p>}

          {rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="text-[11px] text-gray-400 mb-2">Detected source: {broker}. {selected.length} rows ready.</p>
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase text-gray-500">
                  <tr>
                    <th className="py-2">Use</th>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Avg price</th>
                    <th>Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-white/5">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={row.include}
                          disabled={row.flags.length > 0}
                          onChange={(event) => updateRow(row.id, { include: event.target.checked })}
                        />
                      </td>
                      <td className="font-bold text-white">{row.symbol.replace(".NS", "")}</td>
                      <td>
                        <input
                          value={row.quantity}
                          onChange={(event) => updateRow(row.id, { quantity: event.target.value })}
                          className="w-20 h-8 px-2 rounded-lg bg-[#080d18] border border-white/10 text-white"
                        />
                      </td>
                      <td>
                        <input
                          value={row.avgBuyPrice}
                          onChange={(event) => updateRow(row.id, { avgBuyPrice: event.target.value })}
                          className="w-24 h-8 px-2 rounded-lg bg-[#080d18] border border-white/10 text-white"
                        />
                      </td>
                      <td className="text-rose-300">{row.flags.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/10">
          <button
            type="button"
            disabled={saving || selected.length === 0}
            onClick={confirmImport}
            className="h-11 px-4 rounded-xl bg-emerald-500 text-black text-xs font-extrabold disabled:opacity-50"
          >
            {saving ? "Importing…" : `Import ${selected.length} holdings`}
          </button>
        </div>
      </div>
    </div>
  );
}
