# 📈 StockPulse — Indian Stock Market Intelligence & Automated Price Alert Platform

> A production-ready, full-stack fintech platform inspired by **INDmoney**, **Tickertape**, and **TradingView**, engineered specifically for Indian NSE equity investors. Features a 60-second automated price alert engine with instant rich HTML email notifications, live Server-Sent Events (SSE) price streaming, 100-point institutional PulseScore fundamental analysis, multi-horizon forecasts, 8-quarter shareholding & promoter pledge trends, comprehensive financial statements, market-wide corporate actions calendar, full-universe equity screener, and 4-stock side-by-side comparison.

---

## 🚀 Architecture & System Design

```
                    ┌─────────────────────────────────────────┐
                    │            Vercel Frontend              │
                    │   React 19 + Vite 8 + TanStack Query    │
                    │ Tailwind CSS v4 + Motion + TradingView  │
                    └────────────────────┬────────────────────┘
                                         │ HTTPS / SSE Stream / Same-Origin Rewrite
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │             Render Backend              │
                    │       Node.js / Express REST API        │
                    │   Yahoo Finance Gateway + Circuit Break │
                    └────────┬────────────────────┬───────────┘
                             │                    │
             Background Jobs │                    │ Mongoose ODM
            (Snapshot & Crons)│                    ▼
                             ▼          ┌───────────────────────────┐
                    ┌────────────────┐  │      MongoDB Atlas        │
                    │  Alert Engine  │  │ Users (httpOnly & DPDP)   │
                    │  Atomic Leases │  │ StockSnapshots & Screens  │
                    │  NSE Hours Gate│  │ Alerts, Watchlists        │
                    │  Nodemailer TLS│  │ Shareholding Patterns     │
                    └────────────────┘  └───────────────────────────┘
```

---

## 📅 Recent Major Engineering Releases (Sprints 11 – 15)

### 🔬 Sprint 15: Research Depth (Tickertape Parity) — PR #71
*Delivered full fundamental analysis, corporate events, universal screening, and side-by-side peer comparison.*
- **SP-35 (#41) Financial Statements Tab (P&L, Balance Sheet, Cash Flow)**:
  - Added quarterly and annual financial statements tabs to `/stock/:symbol`.
  - Comprehensive KPI ratio cards: Return on Capital Employed (ROCE) computed as $\frac{\text{EBIT}}{\text{Total Assets} - \text{Current Liabilities}}$, Return on Equity (ROE), Debt-to-Equity, Operating Profit Margins, and 3Y / 5Y compound annual growth rates (CAGR).
  - Year-over-year (YoY) percentage change badges and revenue/margin breakdowns.
- **SP-36 (#42) Shareholding Pattern Trend & Promoter Pledge**:
  - 8-quarter ownership trend breakdown across Promoter, Foreign Institutional Investors (FII), Domestic Institutional Investors (DII), Mutual Funds, and Public / Retail shareholders.
  - Promoter pledge risk gauge (`Safe <10%`, `Caution 10–25%`, `High Risk >25%`).
  - Automated institutional sentiment indicators (e.g., *FII stake increase for 2+ consecutive quarters*).
- **SP-37 (#43) Corporate Actions & Market Events Calendar**:
  - Dedicated `/events` page and per-stock corporate actions tracker.
  - Multi-category filtering: Dividends (with ex-date, record date, and dividend yield), Bonus / Stock Splits, and Upcoming Earnings Announcements.
  - Scope filtering: **All NSE**, **My Watchlist**, or **My Portfolio**.
- **SP-38 (#44) Per-Stock News & Exchange Announcements**:
  - `GET /api/news/:symbol` delivering verified company news and corporate releases.
  - Natural rule-based financial sentiment tagging (`Positive`, `Neutral`, `Negative`) and secure `rel="noopener noreferrer"` external links.
- **SP-39 (#45) Full-Universe Screener & Saved Screens**:
  - Universal equity screener on `/markets` filtering across all ~2,364 NSE equities using MongoDB indexed queries.
  - Multi-parameter filter builder: Market Cap, P/E, ROE, ROCE, Debt/Equity, Dividend Yield, PulseScore, and Sector filters.
  - Built-in investment presets (*High Growth Tech*, *Value Dividend Aristocrats*, *Low Debt Quality*, *High Momentum*), streaming CSV export, and custom user-saved screens (`SavedScreen` model).
- **SP-40 (#46) Side-by-Side Stock Comparison (Up to 4 Stocks)**:
  - Interactive comparison tool at `/compare?symbols=RELIANCE,TCS,INFY` comparing up to 4 stocks simultaneously.
  - 100-base normalized performance overlay chart ($P_t / P_0 \times 100$) over 1-year historical trading sessions.
  - Side-by-side metric matrix covering valuation, profitability, solvency, return ratios, and automated "Best in group" badges.

---

### 🛡️ Sprint 14: Trust, Accounts & UI Polish — PR #70
*Hardened user authentication, privacy compliance, accessibility, and design system.*
- **SP-29 (#35) Secure Authentication & Cookie Sessions**:
  - Replaced localStorage auth with secure, `httpOnly`, `SameSite=Lax` cookie sessions.
  - Rotating refresh tokens with automatic token reuse detection and multi-device revocation.
  - Strict Content Security Policy (CSP) headers applied via Helmet.
- **SP-30 (#36) Verification Lifecycle & DPDP Act 2023 Compliance**:
  - Email verification workflow with 6-digit cryptographic OTPs and automated welcome emails.
  - User Settings page (`/settings`) for profile updates, audio/email alert preference toggles, and password changes.
  - Indian Digital Personal Data Protection (DPDP) Act 2023 compliance: complete JSON data export and cascading account erasure.
- **SP-31 (#37) SEBI Compliance & Legal Documentation**:
  - Mandated SEBI non-registered research analyst disclaimers on all stock analysis pages and algorithmic forecasts.
  - Official public legal documentation: Terms of Service (`/terms`), Privacy Policy (`/privacy`), and Investment Disclaimer (`/disclaimer`).
  - Clear data-source attribution badges (Yahoo Finance, NSE/BSE).
- **SP-32 (#38) Design System Tokens & Dual Theme (Dark / Light)**:
  - System-wide theme switcher supporting Dark Mode and Light Mode with persistent local storage.
  - Accessible design system tokens, skeleton loading states, empty states, and compact Indian currency formatters (`formatCompactINR` for Lakh / Cr notations).
- **SP-33 (#39) Mobile Experience & Progressive Web App (PWA)**:
  - Floating mobile bottom navigation bar with active route indicators and haptic-style transitions.
  - Offline status banner for network drops and installable PWA web app manifest (`manifest.json`).
  - Keyboard navigation focus management and ARIA roles for full accessibility compliance.
- **SP-34 (#40) Public Discovery, SEO & XML Sitemap**:
  - Publicly accessible stock details (`/stock/:symbol`) and market research pages (`/markets`, `/events`, `/compare`) for unauthenticated users.
  - Dynamic OpenGraph and Twitter card SEO meta tags via `react-helmet-async`.
  - Automated XML sitemap generation (`/sitemap.xml`) indexing all ~2,364 NSE equities and search-engine `robots.txt`.

---

### ⚡ Sprint 13: Performance & Speed — PR #68
*Engineered extreme speed, route code-splitting, realtime streaming, and API resilience.*
- **SP-23 (#29) TanStack React Query & Polling Consolidation**:
  - Migrated key state flows (indices, market movers, notifications, alerts, watchlists) to React Query.
  - Consolidated duplicate background polling with window focus & tab visibility listeners.
- **SP-24 (#30) Lightweight Bundle Diet & Route Splitting**:
  - Code-split all major routes via React `lazy()` and `Suspense`.
  - Replaced heavy charting libraries on secondary cards with native SVG sparklines and custom CSS donut charts.
  - Initial gzipped entry bundle reduced to < 35 KB; total initial JS under 120 KB.
- **SP-25 (#31) HTTP Edge Caching & Vercel Same-Origin Proxy**:
  - Added HTTP compression middleware (`compression`).
  - Edge caching headers (`Cache-Control: public, s-maxage=60, stale-while-revalidate=120`) on market snapshot endpoints.
  - Configured same-origin `/api/*` Vercel rewrites to eliminate cross-origin preflight latency.
- **SP-26 (#32) Yahoo Finance Gateway & StockSnapshot Background Job**:
  - Centralized Yahoo Finance query gateway with circuit breaker logic and upstream failure fallbacks.
  - Nightly background worker (`StockSnapshot` collection) pre-populating pricing and fundamental metrics for fast queries.
- **SP-27 (#33) Live SSE Price Quote Streaming**:
  - Server-Sent Events endpoint `GET /api/stream?symbols=...` for low-latency, zero-polling live ticker updates.
  - Client-side hook `useLiveQuotes` with automatic reconnect and channel subscription management.
- **SP-28 (#34) Request Correlation & Health Observability**:
  - Unique `X-Request-Id` tracing middleware across all HTTP requests.
  - Root React `ErrorBoundary` with reset capabilities.
  - Enhanced `/api/health` endpoint detailing database connectivity, alert engine health, and background worker state.

---

### 🎯 Sprint 12: Correctness & Data Honesty — PR #66
*Eliminated artificial data, validated alert mechanics, and established automated testing.*
- **SP-17 (#23) Alert Engine Correctness & Multi-Instance Safety**:
  - Alert execution strictly gated to active NSE market hours (09:15 to 15:30 IST, Monday – Friday).
  - NSE holiday calendar integration to prevent erroneous alert execution on exchange holidays.
  - Distributed atomic lease locking (`findOneAndUpdate`) to prevent duplicate email triggers across multi-container deployments.
  - Rejection of target prices already met at creation time.
- **SP-18 (#24) Pure Honest Market Data**:
  - Eradicated all synthetic/mock financial figures from production endpoints.
  - Accurate data labeling for Trailing P/E, Forward P/E, Market Cap, and normalized dividend yields.
- **SP-19 (#25) Single Source of Truth for PulseScore & Forecasts**:
  - Unified 100-point PulseScore calculation in a shared backend service used by both dossier cards and forecast models.
- **SP-20 (#26) Race Condition Elimination**:
  - Fixed asynchronous component unmount race conditions and stale auth closures across React views.
- **SP-21 (#27) Database Optimization**:
  - Added compound indexes on MongoDB collections (`symbol`, `userId`, `triggered`, `createdAt`).
  - Implemented cursor-based pagination and TCP keepAlive connection options on Mongoose.
- **SP-22 (#28) Automated Test Baseline**:
  - Established Node.js test runner suite (`node --test`) with MongoDB Memory Server.
  - Vitest test suite for client utility formatters and broker CSV parsers.
  - Minimum 60% server line coverage enforcement (currently at **73.96%**).

---

### 🔒 Sprint 11: Security Hotfix — PR #57
*Secrets hygiene, sanitization, and automated CI pipelines.*
- **SP-15 (#21) Input Validation & Error Sanitization**:
  - Built comprehensive request validation middleware using `express-validator` on all API endpoints.
  - Production-safe error handling to eliminate database schema leaks and stack traces in HTTP responses.
- **SP-16 (#22) Hardened GitHub CI Pipeline**:
  - Secret scanning with **Gitleaks** and **GitGuardian Push Protection**.
  - Production npm vulnerability auditing (`npm audit --audit-level=high`).
  - Automated testing for client and server on every pull request.
  - Automated dependency updates via **Dependabot**.
- **Credentials & Transport Hygiene**:
  - Removed demo credentials from login interfaces.
  - Restricted CORS origins to authorized StockPulse domains.
  - Enforced strict TLS verification and HTML sanitization on all transactional alert emails.

---

## 🧠 Institutional Intelligence & PulseScore™

StockPulse features a proprietary **100-Point Fundamental PulseScore Engine**, inspired by the *Coffee Can Investing* framework:

| Category | Max Score | Key Metrics Evaluated |
| :--- | :---: | :--- |
| **Profitability** | 25 pts | Operating Margins, ROCE, ROE consistency |
| **Solvency & Health** | 25 pts | Debt-to-Equity (< 0.5 preferred), Interest Coverage |
| **Growth Consistency** | 20 pts | 3Y & 5Y Revenue and Net Profit CAGR |
| **Valuation & Quality** | 15 pts | P/E vs Industry Peers, Price-to-Book, PEG Ratio |
| **Governance & Ownership**| 15 pts | Promoter holding stability, Pledge % (< 10%), FII/DII trend |

- **Stock Dossier**: Visual breakdown of strong compounders vs high-debt speculative equities.
- **Portfolio Diagnostic**: Instant portfolio-level health audit highlighting overconcentration, low-scoring equities, and high-debt exposures.
- **Algorithmic Forecasts**: 1-Year, 3-Year, and 5-Year target projections factoring in historical earnings growth, analyst consensus, and compound interest compounding rates.

---

## 🛠️ Complete Feature Set Summary

- **⚡ Real-Time Price Alerts**: Target price alerts with instant rich HTML email notifications.
- **📈 Advanced Candlestick Charts**: Powered by TradingView Lightweight Charts v5 with RSI, MACD, SMA, EMA, and Volume sub-panes.
- **🔍 2,364+ NSE Equity Search**: Instant sub-millisecond local symbol resolution.
- **📊 Financial Statements**: P&L, Balance Sheet, and Cash Flow with annual/quarterly toggles and YoY growth.
- **👥 Shareholding Trends**: 8-quarter ownership breakdown with institutional sentiment & promoter pledge alerts.
- **📅 Corporate Events**: Dividends, stock splits, bonus issues, and earnings announcements calendar.
- **🔎 Universal Screener**: Multi-metric screener with pre-built presets and CSV streaming.
- **⚖️ Side-by-Side Compare**: 4-stock comparison with 100-base normalized performance chart.
- **💼 Portfolio Tracker & Broker CSV**: Upload Zerodha/Groww portfolio exports for instant tracking.
- **🛡️ DPDP & Privacy**: Full data export, account deletion, and SEBI compliance notices.

---

## ⚙️ Environment Configuration

### Server (`server/.env`)
```ini
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/stockpulse
JWT_SECRET=your_super_secret_jwt_key_at_least_32_bytes_long
EMAIL_USER=your_verified_sender_address@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=https://stockpulse-mu-three.vercel.app
ALLOWED_ORIGINS=https://stockpulse-mu-three.vercel.app,http://localhost:5173
RENDER_EXTERNAL_URL=https://stock-market-platform-2j95.onrender.com
```

### Client (`client/.env`)
```ini
VITE_API_URL=https://stock-market-platform-2j95.onrender.com/api
```

---

## 🧪 Testing & Verification

Run the comprehensive test suites locally:

```bash
# Server Test Suite & Line Coverage Report (node --test + c8)
cd server
npm test

# Client Unit Tests (vitest)
cd ../client
npm test

# Client Production Build Check (vite build)
npm run build
```

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/shailesh7705/stock-market-platform.git
cd stock-market-platform

# 2. Install dependencies
cd client && npm install
cd ../server && npm install

# 3. Start development servers
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.
