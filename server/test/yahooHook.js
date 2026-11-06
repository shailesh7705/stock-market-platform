const Module = require("module");
const path = require("path");

const yahoo = {
  quote: async () => null,
  quoteSummary: async () => ({}),
  chart: async () => ({ quotes: [] }),
  search: async () => ({ quotes: [] }),
};

const original = Module.prototype.require;
let wrappingHours = false;

Module.prototype.require = function requireWithTestDoubles(id) {
  if (id === "yahoo-finance2") {
    return {
      default: class YahooFinance {
        constructor() {
          return yahoo;
        }
      },
    };
  }

  if (!wrappingHours && (id === "../utils/marketHours" || id.endsWith(`${path.sep}marketHours.js`) || id.endsWith("/utils/marketHours"))) {
    wrappingHours = true;
    try {
      const real = original.apply(this, arguments);
      const open = () => global.__marketOpen !== false;
      return { ...real, isMarketOpen: open };
    } finally {
      wrappingHours = false;
    }
  }

  if (id === "./sendEmail" || id === "../utils/sendEmail" || id.endsWith(`${path.sep}sendEmail.js`)) {
    return async () => ({ success: true });
  }

  return original.apply(this, arguments);
};

module.exports = { yahoo };
