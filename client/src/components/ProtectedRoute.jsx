// client/src/components/ProtectedRoute.jsx
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { isTokenValid } from "../utils/authToken";

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const valid = isTokenValid(token);

  useEffect(() => {
    if (!valid && token) logout();
  }, [valid, token, logout]);

  if (!valid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
