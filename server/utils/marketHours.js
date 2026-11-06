const calendar = require("../data/nseHolidays.json");

const HOLIDAYS = new Set(calendar.holidays);
const OPEN_MINUTES = 9 * 60 + 15;
const CLOSE_MINUTES = 15 * 60 + 30;
const PRE_MINUTES = 9 * 60;
const POST_MINUTES = 16 * 60;

let warnedUncovered = false;

function istParts(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    weekday: map.weekday,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
}

function getMarketSession(now = new Date()) {
  const { date, weekday, minutes } = istParts(now);
  const calendarCovered = date <= calendar.coverageThrough;
  if (!calendarCovered && !warnedUncovered) {
    warnedUncovered = true;
    console.warn(
      `[MarketHours] NSE holiday list only covers up to ${calendar.coverageThrough}; update server/data/nseHolidays.json.`
    );
  }

  const holiday = HOLIDAYS.has(date);
  const weekend = weekday === "Sat" || weekday === "Sun";
  const tradingDay = !holiday && !weekend;

  let phase = "closed";
  if (tradingDay && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES) phase = "open";
  else if (tradingDay && minutes >= PRE_MINUTES && minutes < OPEN_MINUTES) phase = "pre";
  else if (tradingDay && minutes >= CLOSE_MINUTES && minutes < POST_MINUTES) phase = "post";

  return {
    phase,
    isOpen: phase === "open",
    tradingDay,
    holiday,
    istDate: date,
    calendarCovered,
  };
}

const isMarketOpen = (now = new Date()) => getMarketSession(now).isOpen;

module.exports = {
  getMarketSession,
  isMarketOpen,
  holidayCalendar: calendar,
};
