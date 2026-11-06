import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Activity, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { resetPassword } from "../services/authService";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      const data = await resetPassword({ token, password });
      toast.success(data.message || "Password updated");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset link is invalid or has expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0e1626] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#080d1a] border border-amber-400/40 flex items-center justify-center">
            <Activity size={18} className="text-amber-400" />
          </div>
          <span className="text-xl font-extrabold text-white">StockPulse</span>
        </Link>
        <h1 className="text-2xl font-bold text-white">Choose a new password</h1>
        <p className="text-xs text-gray-400 mt-1 mb-6">
          Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              className="w-full h-11 bg-[#080d1a] border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white outline-none focus:border-emerald-500/50"
            />
          </div>
          <input
            type="password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Confirm password"
            className="w-full h-11 bg-[#080d1a] border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-emerald-500/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-emerald-500 text-black text-xs font-extrabold disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
