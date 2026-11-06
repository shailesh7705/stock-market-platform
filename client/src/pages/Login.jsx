// client/src/pages/Login.jsx
import { useState, useEffect } from "react";
import { Eye, EyeOff, Zap, Activity, Lock, Mail, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";
import { loginUser } from "../services/authService";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

function Login({ isModal = false, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("expired") === "1") {
      setIsSessionExpired(true);
    }
  }, [location.search]);

  async function handleLogin(e, customEmail, customPassword) {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    if (!loginEmail || !loginPass) {
      toast.error("Please fill in both email and password");
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser({ email: loginEmail, password: loginPass });
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user?.name || "Investor"}!`, { icon: "👋" });
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Fast Login Helper
  const handleQuickLogin = (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
    handleLogin(null, userEmail, userPassword);
  };

  const formContent = (
    <div className="w-full">
      {!isModal && (
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
                <Activity size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-amber-400 transition-colors">
                StockPulse
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono tracking-wider">
                PRO
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-gray-400 mt-1">
            Access your live NSE watchlist and active price alerts
          </p>
        </div>
      )}

      {/* Session Expired Banner */}
      {isSessionExpired && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
          <AlertCircle size={15} className="shrink-0 text-amber-400" />
          <span>Your session has expired. Please sign in to re-activate your alerts.</span>
        </div>
      )}

      <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 bg-[#080d1a] border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-gray-600 font-medium"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 bg-[#080d1a] border border-white/10 rounded-xl pl-10 pr-10 text-xs text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-gray-600 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end mt-1.5">
            <Link to="/forgot-password" className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300">
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Authenticating...
              </span>
            ) : (
              <>
                Sign In to Dashboard <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* 1-Click Fast Accounts */}
        <div className="pt-2 border-t border-white/[0.08]">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-center mb-2.5">
            Quick 1-Click Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("shaileshkumaar4455@gmail.com", "shailesh123")}
              className="px-2.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all group"
            >
              <span className="block text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                Shailesh Kumaar
              </span>
              <span className="block text-[9px] text-gray-400 truncate">
                shaileshkumaar4455...
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("demo@stockpulse.com", "demo1234")}
              className="px-2.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all group"
            >
              <span className="block text-[11px] font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                Demo Investor
              </span>
              <span className="block text-[9px] text-gray-400 truncate">
                demo@stockpulse.com
              </span>
            </button>
          </div>
        </div>

        {/* Switch Link */}
        <p className="text-center text-xs text-gray-400 pt-1">
          Don't have an account?{" "}
          {isModal ? (
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-emerald-400 font-bold hover:underline ml-1"
            >
              Create Account
            </button>
          ) : (
            <Link to="/signup" className="text-emerald-400 font-bold hover:underline ml-1">
              Create Account
            </Link>
          )}
        </p>
      </form>
    </div>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="min-h-screen bg-[#080d1a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0e1626] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/80">
        {formContent}
      </div>
    </div>
  );
}

export default Login;
