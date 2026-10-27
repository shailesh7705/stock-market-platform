// client/src/pages/Login.jsx
import { useState } from "react";
import { Eye, EyeOff, Zap, Lock, Mail, ArrowRight } from "lucide-react";
import { loginUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

function Login({ isModal = false, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in both email and password");
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser({ email, password });
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

  const formContent = (
    <div className="w-full">
      {!isModal && (
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black shadow-lg shadow-emerald-500/25">
              <Zap size={18} className="fill-current" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">StockPulse</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-gray-400 mt-1">
            Access your live NSE watchlist and active price alerts
          </p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
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

        {/* Switch Link */}
        <p className="text-center text-xs text-gray-400 pt-2">
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
