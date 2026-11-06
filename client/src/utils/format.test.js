import { describe, expect, it } from "vitest";
import { formatInr, formatVolume } from "./format";
import { parseBrokerCsv } from "./brokerCsv";
import { getMarketStatus } from "./marketHours";

describe("number formatters", () => {
  it("keeps a zero price and a zero volume", () => {
    expect(formatInr(0)).toBe("0.00");
    expect(formatVolume(0)).toBe("0");
    expect(formatInr(null)).toBe("—");
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
