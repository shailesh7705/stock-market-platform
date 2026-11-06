// Fallback until the server calendar (/api/market/calendar) loads.
const NSE_HOLIDAYS = new Set([
  "2026-01-26",
  "2026-03-03",
  "2026-03-26",
  "2026-03-31",
  "2026-04-03",
  "2026-04-14",
  "2026-05-01",
  "2026-05-28",
  "2026-06-26",
  "2026-09-14",
  "2026-10-02",
  "2026-10-20",
  "2026-11-10",
  "2026-11-24",
  "2026-12-25",
]);

export function applyHolidayCalendar(holidays) {
  if (!Array.isArray(holidays)) return;
  for (const date of holidays) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) NSE_HOLIDAYS.add(date);
  }
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OPEN_MINUTES = 9 * 60 + 15;
const CLOSE_MINUTES = 15 * 60 + 30;
const PRE_MINUTES = 9 * 60;
const POST_MINUTES = 16 * 60;

function istParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function dateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftDate(year, month, day, days) {
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    weekday: WEEKDAYS[next.getUTCDay()],
  };
}

function isClosedDay(year, month, day, weekday) {
  const weekend = weekday === "Sat" || weekday === "Sun";
  return weekend || NSE_HOLIDAYS.has(dateKey(year, month, day));
}

function formatGap(totalMinutes) {
  const minutes = Math.max(0, totalMinutes);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

export function getMarketStatus(now = new Date()) {
  const parts = istParts(now);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const holiday = NSE_HOLIDAYS.has(dateKey(year, month, day));
  const weekend = parts.weekday === "Sat" || parts.weekday === "Sun";
  const tradingDay = !holiday && !weekend;

  let phase = "closed";
  if (tradingDay && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES) phase = "open";
  else if (tradingDay && minutes >= PRE_MINUTES && minutes < OPEN_MINUTES) phase = "pre";
  else if (tradingDay && minutes >= CLOSE_MINUTES && minutes < POST_MINUTES) phase = "post";

  let countdown = "Opens Mon 09:15 AM";
  if (phase === "open") {
    countdown = `Closes in ${formatGap(CLOSE_MINUTES - minutes)}`;
  } else if (phase === "pre") {
    countdown = `Opens in ${formatGap(OPEN_MINUTES - minutes)}`;
  } else {
    let cursor = { year, month, day, weekday: parts.weekday };
    if (tradingDay && minutes < OPEN_MINUTES) {
      countdown = `Opens ${cursor.weekday} 09:15 AM`;
    } else {
      for (let step = 1; step <= 14; step += 1) {
        cursor = shiftDate(year, month, day, step);
        if (!isClosedDay(cursor.year, cursor.month, cursor.day, cursor.weekday)) {
          countdown = `Opens ${cursor.weekday} 09:15 AM`;
          break;
        }
      }
    }
  }

  const labels = {
    open: "Market Open",
    pre: "Pre-Market",
    post: "Post-Market",
    closed: holiday ? "Market Holiday" : "Market Closed",
  };
  const shortLabels = {
    open: "Open",
    pre: "Pre",
    post: "Post",
    closed: holiday ? "Holiday" : "Closed",
  };

  return {
    phase,
    label: labels[phase],
    shortLabel: shortLabels[phase],
    countdown,
    holiday,
  };
}

export function isMarketOpen(now = new Date()) {
  return getMarketStatus(now).phase === "open";
}
