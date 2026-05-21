
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home               from "./pages/Home";
import Login              from "./pages/Login";
import Signup             from "./pages/Signup";
import DashboardPage      from "./pages/DashboardPage";
import StockDetailsPage   from "./pages/StockDetailsPage";
import WatchlistPage      from "./pages/WatchlistPage";
import ProtectedRoute     from "./components/ProtectedRoute";
import NotificationListener from "./components/notifications/NotificationListener";

function App() {
  return (
    <BrowserRouter>
      <NotificationListener />
      <Routes>

        {/* Public */}
        <Route path="/"       element={<Home />}   />
        <Route path="/login"  element={<Login />}  />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />

        <Route path="/stock/:symbol" element={
          <ProtectedRoute><StockDetailsPage /></ProtectedRoute>
        } />

        <Route path="/watchlist" element={
          <ProtectedRoute><WatchlistPage /></ProtectedRoute>
        } />

        {/* Fallback — redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;