import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { forgotPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const data = await forgotPassword(email);
      setSent(true);
      toast.success(data.message || "Check your inbox for the reset link");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start the reset");
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
        <h1 className="text-2xl font-bold text-white">Forgot password</h1>
        <p className="text-xs text-gray-400 mt-1 mb-6">
          We will email a one-time link that expires in 20 minutes.
        </p>
        {sent ? (
          <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            If an account exists for {email}, the reset link is on the way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 bg-[#080d1a] border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-500 text-black text-xs font-extrabold disabled:opacity-50"
            >
              {loading ? "Sending..." : "Email reset link"}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
