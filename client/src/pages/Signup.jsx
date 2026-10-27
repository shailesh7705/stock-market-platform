// client/src/pages/Signup.jsx
import { useState } from "react";
import { Eye, EyeOff, Zap, Lock, Mail, User, ArrowRight } from "lucide-react";
import { registerUser, loginUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

function Signup({ isModal = false, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  async function handleSignup(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await registerUser({ name: name.trim(), email: email.trim(), password });

      // Automatically sign in after registration
      const loginData = await loginUser({ email: email.trim(), password });
      setAuth(loginData.user, loginData.token);

      toast.success(`Account created! Welcome to StockPulse, ${name}!`, {
        icon: "🎉",
        duration: 4000,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration failed. Try again.");
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Free Account</h1>
          <p className="text-xs text-gray-400 mt-1">
            Track NSE stocks and configure automated email price alerts
          </p>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              required
              placeholder="Shailesh Kumaar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 bg-[#080d1a] border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-gray-600 font-medium"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Email Address (For Alerts)
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

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Password (Min 6 chars)
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

        {/* Submit Button */}
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
                Creating Account...
              </span>
            ) : (
              <>
                Create Free Account <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Switch Link */}
        <p className="text-center text-xs text-gray-400 pt-2">
          Already have an account?{" "}
          {isModal ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-emerald-400 font-bold hover:underline ml-1"
            >
              Sign In
            </button>
          ) : (
            <Link to="/login" className="text-emerald-400 font-bold hover:underline ml-1">
              Sign In
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

export default Signup;
