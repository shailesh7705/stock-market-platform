import { describe, expect, it } from "vitest";
import { formatInr, formatVolume, formatCompactINR, formatPercent, formatCurrency } from "./format";
import { parseBrokerCsv } from "./brokerCsv";
import { getMarketStatus } from "./marketHours";

describe("number formatters", () => {
  it("keeps a zero price and a zero volume", () => {
    expect(formatInr(0)).toBe("0.00");
    expect(formatVolume(0)).toBe("0");
    expect(formatInr(null)).toBe("—");
  });

  it("formats compact INR with Cr and L notations", () => {
    expect(formatCompactINR(15000000)).toBe("₹1.50 Cr");
    expect(formatCompactINR(-250000)).toBe("-₹2.50 L");
    expect(formatCompactINR(5000)).toBe("₹5.0 K");
    expect(formatCompactINR(42)).toBe("₹42.00");
    expect(formatCompactINR(null)).toBe("—");
  });

  it("formats percentage with explicit +/- sign", () => {
    expect(formatPercent(5.25)).toBe("+5.25%");
    expect(formatPercent(-3.1)).toBe("-3.10%");
    expect(formatPercent(0)).toBe("0.00%");
    expect(formatPercent(null)).toBe("—");
  });

  it("formats full currency strings", () => {
    expect(formatCurrency(1234.56)).toBe("₹1,234.56");
    expect(formatCurrency(15000000, { compact: true })).toBe("₹1.50 Cr");
    expect(formatCurrency(null)).toBe("—");
  });
});

describe("broker csv", () => {
  it("reads a zerodha-style holding", () => {
    const csv = "Symbol,Quantity,Average Price\nRELIANCE,2,2500.5\n";
    const parsed = parseBrokerCsv(csv);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].symbol).toContain("RELIANCE");
    expect(parsed.rows[0].quantity).toBe(2);
    expect(parsed.rows[0].avgBuyPrice).toBe(2500.5);
  });
});

describe("market hours", () => {
  it("reports a session label", () => {
    const status = getMarketStatus(new Date("2026-11-06T03:45:00Z"));
    expect(status.label || status.status || status.phase || status.isOpen).toBeTruthy();
  });
});
