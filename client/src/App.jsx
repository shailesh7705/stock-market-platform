// client/src/App.jsx
import { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationListener from "./components/notifications/NotificationListener";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const StockDetailsPage = lazy(() => import("./pages/StockDetailsPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const MarketsPage = lazy(() => import("./pages/MarketsPage"));
const Settings = lazy(() => import("./pages/Settings"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/legal/PrivacyPage"));
const DisclaimerPage = lazy(() => import("./pages/legal/DisclaimerPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse mb-4">
        <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
      <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase font-mono">
        StockPulse Terminal Loading...
      </p>
    </div>
  );
}

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-black text-xs font-extrabold py-2 px-4 text-center sticky top-0 z-50 shadow-md">
      You are currently browsing offline. Displaying cached data. Reconnecting when connection resumes.
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <NotificationListener />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public Marketing & Authentication */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* Public Research & Equity Discovery (SP-34 SEO / Unlocked) */}
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/stock/:symbol" element={<StockDetailsPage />} />

          {/* Compliance & Legal Documentation (SP-31) */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />

          {/* Protected User Dashboard & Portfolio Suite */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <WatchlistPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <PortfolioPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
