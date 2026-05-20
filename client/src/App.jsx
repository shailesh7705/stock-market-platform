import {

  BrowserRouter,
  Routes,
  Route

} from "react-router-dom";

import Home from "./pages/Home";

import Login from "./pages/Login";

import Signup from "./pages/Signup";

import DashboardPage from "./pages/DashboardPage";

import ProtectedRoute from "./components/ProtectedRoute";

import NotificationListener from "./components/notifications/NotificationListener";

import StockDetailsPage from "./pages/StockDetailsPage";

function App() {

  return (

    <BrowserRouter>

      {/* Global Notification Engine */}
      <NotificationListener />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route

          path="/dashboard"

          element={

            <ProtectedRoute>

              <DashboardPage />

            </ProtectedRoute>

          }

        />
        <Route

  path="/stock/:symbol"

  element={

    <ProtectedRoute>

      <StockDetailsPage />

    </ProtectedRoute>

  }

/>

      </Routes>

    </BrowserRouter>

  );

}

export default App;