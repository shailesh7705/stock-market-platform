// client/src/components/auth/AuthModal.jsx
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Login from "../../pages/Login";
import Signup from "../../pages/Signup";

function AuthModal({ open, onClose, type, setType }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl border border-white/5">
          <button
            id="auth-modal-title"
            onClick={() => setType("login")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              type === "login"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>

          <button
            onClick={() => setType("signup")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              type === "signup"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Forms */}
        <div>{type === "login" ? <Login /> : <Signup />}</div>
      </div>
    </div>
  );
}

export default AuthModal;
