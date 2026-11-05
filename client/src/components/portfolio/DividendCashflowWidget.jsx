function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function DividendCashflowWidget({ summary }) {
  const income = summary?.annualDividendIncome || 0;
  const yoc = summary?.yieldOnCost || 0;
  const calendar = summary?.dividendCalendar || [];
  const leaders = summary?.topDividendPayers || [];
  const maxMonth = Math.max(...calendar.map((month) => month.amount), 1);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0e1626] p-5">
      <h2 className="text-sm font-extrabold text-white">12-Month Dividend Income</h2>
      <p className="text-[11px] text-gray-400 mt-1">Projected from trailing annual dividend per share. Payouts are grouped into the Mar, Jun, Sep, and Dec cycle.</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-2xl bg-[#080d18] border border-white/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Annual cashflow</p>
          <p className="text-xl font-black text-emerald-300 font-mono mt-1">{formatINR(income)}</p>
        </div>
        <div className="rounded-2xl bg-[#080d18] border border-white/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Yield on cost</p>
          <p className="text-xl font-black text-amber-300 font-mono mt-1">{Number(yoc).toFixed(2)}%</p>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1 h-16">
        {calendar.map((month) => (
          <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-emerald-400/80"
              style={{ height: `${Math.max(4, (month.amount / maxMonth) * 40)}px`, opacity: month.amount ? 1 : 0.25 }}
            />
            <span className="text-[9px] text-gray-500">{month.month.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Top dividend payers</p>
        {leaders.length === 0 ? (
          <p className="text-xs text-gray-500 mt-2">None of the current holdings have a trailing dividend.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {leaders.map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{holding.symbol.replace(".NS", "")}</span>
                <span className="font-mono text-emerald-300">{formatINR(holding.annualDividendCash)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
