# 📈 StockPulse — Indian Stock Market Intelligence & Automated Price Alert Platform

> A production-ready, full-stack fintech platform inspired by **INDmoney** and **Tickertape**, built for Indian NSE equity investors. Features 60-second automated price alert engine with instant rich HTML email notifications, interactive 52-week & day range analytics, real-time Nifty 50 / Sensex tickers, watchlists with live sparklines, and 2,360+ NSE equity search.

---

## 🚀 Key Highlights & Architecture

```
                    ┌─────────────────────────┐
                    │      Vercel Frontend    │
                    │   React 19 + Vite 8     │
                    │ Tailwind CSS v4 + Motion│
                    └────────────┬────────────┘
                                 │ HTTPS REST
                                 ▼
                    ┌─────────────────────────┐
                    │     Render Backend      │
                    │  Node.js / Express API  │
                    │    Yahoo Finance v3     │
                    └───────┬──────────┬──────┘
                            │          │
            60s Cron Loop   │          │ MongoDB Atlas
                            ▼          ▼
             ┌────────────────┐     ┌────────────────┐
             │  Alert Engine  │     │ Database:      │
             │  Atomic update │     │ Users, Alerts, │
             │  Nodemailer    │     │ Watchlists,    │
             │  HTML Template │     │ Notifications  │
             └────────────────┘     └────────────────┘
```

---

## 🛠️ Ticket-by-Ticket Resolution & Feature Upgrades

### Ticket 1: Backend Deployment & Core Alert Engine Overhaul
- **Fixed Inverted Alert Condition Bug**: Previously, the alert engine only checked `currentPrice <= targetPrice` regardless of the user's intent, triggering false positive emails within 60 seconds whenever a user set a target above market price. Added `condition: "above" | "below"`, `initialPrice`, and `triggeredPrice` fields.
- **Race Condition & Duplicate Trigger Protection**: Switched alert triggering to atomic MongoDB operations (`findOneAndUpdate({ _id, triggered: false }, ...)`). If concurrent cron executions occur, only a single instance can claim and trigger the alert.
- **Fixed `yahoo-finance2` Class Instantiation**: Updated all imports to `const YahooFinance = require("yahoo-finance2").default; const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });` to resolve v3 runtime errors on cloud datacenters.
- **Optimized Batch Quote Fetching**: Eliminated serial requests that caused 30-second HTTP timeouts on Render. Indices (`^NSEI`, `^BSESN`) and Market Movers (20 symbols) now fetch in single batch requests under 1 second.
- **Instant Local NSE Search (0ms)**: Built in-memory search over 2,364 verified Indian NSE equities (`server/data/stocks.json`) with prefix and substring matching. Prevents Yahoo Finance search 500 errors on Render while keeping online fallback for BSE/international tickers.
- **Dynamic CORS for Vercel Deployments**: Replaced static origin array with dynamic regex matching for `*.vercel.app`, preview domains, localhost, and `process.env.FRONTEND_URL`.
- **Enriched Live Stock Data**: Expanded live quote responses to include `fiftyTwoWeekHigh`, `fiftyTwoWeekLow`, `trailingPE`, `dividendYield`, `marketCap`, `regularMarketDayHigh`, and `regularMarketDayLow`.
- **Test Alert Email Endpoint**: Added `POST /api/alerts/test` allowing users to instantly verify their email notification pipeline from the UI.
- **Resilient Fallback Data**: Added high-availability fallbacks for market indices and market news to guarantee 100% uptime on the frontend even during third-party rate limits.

---

### Ticket 2: Frontend Design System & Global UI Cleanup (INDmoney & Tickertape Aesthetic)
- **Eliminated Default Vite CSS Overrides**: Removed legacy `#root { width: 1126px; text-align: center; }` and boilerplate CSS from `index.css` and `App.css` that broke responsive layouts.
- **Fintech Dark Theme**: Adopted deep slate-navy backgrounds (`#080d1a`, `#0e1626`), micro-borders (`rgba(255,255,255,0.08)`), glowing emerald accents (`#10b981`), tabular figures for financial numbers, and custom sleek scrollbars.
- **TopNavbar Real-Time Market Ticker**:
  - Live NIFTY 50 and SENSEX pills with real-time percentage change.
  - NSE Market Status badge (Open / Closed based on IST trading hours 9:15 AM – 3:30 PM).
  - Real-time IST digital clock.
  - Notification drawer with unread counter and "Mark all as read" button.
  - Mobile hamburger toggle for responsive drawer navigation.
- **Responsive Layout & Mobile Drawer**: Added slide-in mobile navigation drawer ensuring 100% usability across mobile, tablet, and desktop screens.

---

### Ticket 3: Dedicated Price Alerts System (`/alerts` & Quick Modal)
- **Dedicated Alerts Management Page (`/alerts`)**:
  - Filter tabs: **All Alerts**, **Active Monitoring**, and **Triggered Hits**.
  - Visual Progress Bar: Displays current market price and percentage distance to target (e.g. `₹24 away (98.2%)`).
  - **"⚡ Test Email Alert" button**: Sends a real-time verification email to the user's registered inbox.
  - **Re-Arm Action**: Reset triggered alerts to monitor again with one click.
  - Pause / Resume toggle and Delete with confirmation toasts.
- **Revamped `CreateAlertModal`**:
  - Quick target percentage chips (`+2%`, `+5%`, `+10%`, `-5%`, `-10%`) that automatically calculate the target price from current price.
  - Condition toggle: "Rises Above (≥)" vs "Drops Below (≤)".
  - Displays user's destination email address for complete transparency.

---

### Ticket 4: Interactive Stock Details & Watchlist Analytics
- **Stock Details Page (`/stock/:symbol`)**:
  - **52-Week Range Bar**: Visual range slider showing 52W Low, 52W High, and exact marker position of the current price (Tickertape signature feature).
  - **Day's Range Bar**: Visual slider from Day Low to Day High.
  - **Key Fundamentals Grid**: Market Capitalization (formatted in ₹ Lakh Cr / ₹ Cr), P/E Ratio (TTM), Volume, Open Price, Previous Close, and Dividend Yield.
  - **Interactive Chart**: Multi-timeframe area chart supporting `1D`, `1W`, `1M`, `3M`, and `1Y`.
  - **Bullish / Bearish Technical Sentiment Signal**: Dynamic analysis of price momentum and 52-week position.
  - **Inline Quick Alert Box**: Set an alert directly from the stock page without navigating away.
- **Dedicated Watchlist Page (`/watchlist`)**:
  - Full-width tracking table with company logos, prices, 1D % changes, and sparklines.
  - Instant stock search input with quick-add functionality.
  - One-click "Set Alert" and "Remove" actions.

---

### Ticket 5: Homepage, Auth Flow & Deployment Setup
- **Homepage (`/`)**: High-converting fintech hero section, real-time indices marquee, 3-step alert explanation, and interactive demo.
- **Modern Auth Pages (`/login`, `/signup`)**: Removed native browser `alert()` popups in favor of animated toast notifications, password visibility toggles, form validation, and automatic login redirect upon signup.
- **Root Deployment Files**: Added root `vercel.json`, root `package.json`, and root `.gitignore` to ensure effortless deployment on both Vercel and Render.

---

### Ticket 6: Company Logos, Advanced Candlestick Charts & Investment Pros/Cons (Tickertape & INDmoney Experience)
- **Multi-Tier Company Logo Resolver (`StockLogo.jsx`)**:
  - Automatically displays official high-resolution corporate logos for Indian equities.
  - Multi-tier resolution strategy: Tickertape CDN / Clearbit corporate domains → Google Favicon high-res proxy → Elegant fallback gradient badge with ticker initials.
  - Uniformly integrated across **Stock Details**, **Watchlists**, **Alerts Cards**, **Stock Search Dropdown**, and **Top Market Movers**.
- **Advanced Interactive Charts (`StockDetailsChart.jsx`)**:
  - **Candlestick vs. Area Line View**: Toggle between smooth gradient area charts and high-precision financial Candlestick bars (displaying Open, High, Low, Close with custom SVG wicks and bodies).
  - **Technical Indicators (20 EMA Overlay)**: Toggleable 20-period Exponential Moving Average overlay for trend direction and support/resistance analysis.
  - **Volume Histogram**: Integrated lower bar chart displaying trading volume color-coded to bullish/bearish candle closes.
  - **Interactive OHLCV Banner**: Real-time hover cursor updating Open, High, Low, Close, and Volume instantly at the top of the chart canvas.
  - **Multi-Timeframe Support**: Seamless switching between `1D`, `1W`, `1M`, `3M`, and `1Y`.
- **Investment Pros & Cons / SWOT Analysis (`CompanyProsCons.jsx`)**:
  - Inspired by Tickertape's Investment Checklist and INDmoney's Stock Scorecard.
  - **Dynamic Fundamental & Technical Evaluation**: Analyzes Valuation (P/E ratio against benchmarks), 52-Week Range proximity, Day's Trading Momentum, Dividend Yield, and Trading Volume Liquidity.
  - **Balanced Scorecard**: Clearly segmented into Green Pros (Strengths & Tailwinds) and Amber/Red Cons (Watchouts & Valuation Flags) with an overall Investment Checklist score (e.g. `3 of 5 criteria passed`).
  - **Contextual Explanations**: Plain-English rationale for each flag so retail investors can make informed decisions in seconds.

---

## ⚙️ Environment Variables

### Server (`server/.env` & Render Environment Variables)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `MONGO_URI` | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `JWT_SECRET` | Secret key for JWT signing | `your_secret_key` |
| `EMAIL_USER` | Gmail address for sending alerts | `stockalert28@gmail.com` |
| `EMAIL_PASS` | Gmail App Password (16 chars) | `kaad rafp sxuo wbha` |
| `FRONTEND_URL` | Deployed Vercel frontend URL | `https://stockpulse-mu-three.vercel.app` |
| `NEWS_API_KEY` | (Optional) NewsAPI.org API Key | `your_news_api_key` |

### Client (`client/.env` & Vercel Environment Variables)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL to the deployed Render API | `https://stock-market-platform-2j95.onrender.com/api` |

---

## 🚢 Deployment Guide (Redeploying on Vercel & Render)

### 1. Redeploying the Backend on Render
1. Push your updated code to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete fintech UI revamp, alert engine fix, and deployment setup"
   git push origin main
   ```
2. Go to your **[Render Dashboard](https://dashboard.render.com/)** and select your Web Service (`stock-market-platform-2j95`).
3. Under **Settings**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Under **Environment**:
   - Ensure `MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, and `FRONTEND_URL` are configured.
5. Click **Manual Deploy** → **Deploy latest commit** (or Render will automatically trigger upon GitHub push).

### 2. Redeploying the Frontend on Vercel
1. Go to your **[Vercel Dashboard](https://vercel.com/)** and select your project (`stockpulse-mu-three`).
2. Under **Project Settings** → **General**:
   - **Root Directory**: `client` (or leave default root with the provided root `vercel.json`)
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**:
   - Add/Verify `VITE_API_URL` = `https://stock-market-platform-2j95.onrender.com/api`
4. Go to **Deployments** → Click **Redeploy** on the latest deployment (or trigger via GitHub push).

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/shailesh7705/stock-market-platform.git
cd stock-market-platform

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Start Local Servers
- **Backend (Port 5000)**:
  ```bash
  cd server
  npm run dev
  ```
- **Frontend (Port 5173)**:
  ```bash
  cd client
  npm run dev
  ```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📧 Email Alert Verification
To verify that email alerts are working:
1. Log in to your StockPulse account.
2. Navigate to **Price Alerts** (`/alerts`).
3. Click the **"⚡ Test Email Alert"** button.
4. Check your inbox for a formatted HTML alert from `StockPulse Alerts 📈`!
