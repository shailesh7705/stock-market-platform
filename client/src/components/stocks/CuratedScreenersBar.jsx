export const SCREENER_PRESETS = [
  {
    id: "coffee-can",
    label: "Coffee Can Compounders",
    test: (stock) => stock.pulseScore >= 75
      && stock.debtToEquity !== null
      && stock.debtToEquity < 0.5
      && stock.roe > 18
      && stock.profitGrowth,
  },
  {
    id: "dividend-fortress",
    label: "High-Yield Dividend Fortress",
    test: (stock) => stock.dividendYield > 3
      && stock.payoutRatio !== null
      && stock.payoutRatio < 60
      && stock.solvencyScore >= 20,
  },
  {
    id: "undervalued-growth",
    label: "Undervalued Growth",
    test: (stock) => stock.pegRatio !== null
      && stock.pegRatio > 0
      && stock.pegRatio < 1.2
      && stock.trailingPE !== null
      && stock.sectorMedianPE
      && stock.trailingPE < stock.sectorMedianPE
      && stock.buyConsensus >= 70,
  },
  {
    id: "momentum-breakout",
    label: "Momentum Breakout",
    test: (stock) => stock.nearHigh && stock.rsi > 55 && stock.aboveSma50 && stock.aboveSma200,
  },
];

export function filterByPreset(stocks, preset) {
  const rule = SCREENER_PRESETS.find((item) => item.id === preset);
  if (!rule) return stocks;
  return stocks.filter(rule.test);
}

export default function CuratedScreenersBar({ stocks, active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onChange("")}
        className={`shrink-0 h-9 px-3 rounded-full border text-xs font-bold ${!active ? "bg-white text-black border-white" : "border-white/10 text-gray-300"}`}
      >
        All {stocks.length}
      </button>
      {SCREENER_PRESETS.map((preset) => {
        const count = stocks.filter(preset.test).length;
        const selected = active === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={`shrink-0 h-9 px-3 rounded-full border text-xs font-bold ${selected ? "bg-amber-400 text-black border-amber-400" : "border-white/10 text-gray-300"}`}
          >
            {preset.label}
            <span className="ml-1.5 font-mono">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
