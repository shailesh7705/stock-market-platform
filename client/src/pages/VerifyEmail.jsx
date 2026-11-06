// client/src/pages/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, Activity, Loader2 } from "lucide-react";
import API from "../api/axios";
import useAuthStore from "../store/authStore";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const { patchUser } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        const res = await API.post("/auth/verify-email", { token });
        if (!cancelled) {
          setStatus("success");
          setMessage(res.data?.message || "Email verified successfully!");
          if (res.data?.user) {
            patchUser(res.data.user);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err.response?.data?.message || "Verification link is invalid or has expired.");
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, patchUser]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#0e1626] border border-white/10 rounded-2xl p-8 text-center shadow-2xl space-y-6">
        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <div className="w-full h-full bg-[#080b11] rounded-[10px] flex items-center justify-center text-amber-400">
            <Activity size={24} />
          </div>
        </div>

        {status === "verifying" && (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-400" />
            <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
            <p className="text-xs text-gray-400">Please wait while we confirm your account security.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Email Verified!</h2>
            <p className="text-xs text-gray-300 leading-relaxed">{message}</p>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                Continue to Dashboard <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <XCircle size={24} />
            </div>
            <h2 className="text-xl font-black text-white">Verification Failed</h2>
            <p className="text-xs text-rose-300/80 leading-relaxed">{message}</p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/settings"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Go to Settings to Resend Link
              </Link>
              <Link
                to="/"
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
