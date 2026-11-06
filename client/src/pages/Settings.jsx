// client/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Shield,
  Bell,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Moon,
  Sun,
  Laptop,
  Mail,
  Volume2,
  RefreshCw,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import API from "../api/axios";
import useAuthStore from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function Settings() {
  const { user, patchUser, logout, logoutAll, fetchProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  // Profile form state
  const [name, setName] = useState(user?.name || "");
  const [alertSound, setAlertSound] = useState(user?.alertSound !== false);
  const [emailNotifs, setEmailNotifs] = useState(user?.emailNotificationsEnabled !== false);
  const [digestFreq, setDigestFreq] = useState(user?.alertDigestFrequency || "instant");
  const [savingSettings, setSavingSettings] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Email verification state
  const [resendingEmail, setResendingEmail] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Export data state
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchProfile().then((fresh) => {
      if (fresh) {
        setName(fresh.name || "");
        setAlertSound(fresh.alertSound !== false);
        setEmailNotifs(fresh.emailNotificationsEnabled !== false);
        setDigestFreq(fresh.alertDigestFrequency || "instant");
      }
    });
  }, [fetchProfile]);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      return toast.error("Name cannot be empty");
    }

    try {
      setSavingSettings(true);
      const res = await API.put("/auth/settings", {
        name: name.trim(),
        alertSound,
        emailNotificationsEnabled: emailNotifs,
        alertDigestFrequency: digestFreq,
        themePreference: theme,
      });

      if (res.data?.user) {
        patchUser(res.data.user);
      }
      toast.success("Preferences updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return toast.error("Please enter both current and new passwords");
    }
    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }

    try {
      setChangingPassword(true);
      await API.put("/auth/password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully! Other devices have been logged out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendingEmail(true);
      const res = await API.post("/auth/resend-verification");
      toast.success(res.data?.message || "Verification email sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send verification email");
    } finally {
      setResendingEmail(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const res = await API.get("/auth/export-data", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stockpulse-data-export-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Personal data archive downloaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      return toast.error("Enter your password to confirm account deletion");
    }

    try {
      setDeleting(true);
      await API.delete("/auth/account", { data: { password: deletePassword } });
      toast.success("Account and associated data deleted");
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm("Are you sure you want to log out of all active devices?")) {
      await logoutAll();
      toast.success("Logged out of all devices");
      navigate("/login");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your profile, theme, notification channels, and privacy settings
        </p>
      </div>

      {/* ── Section 1: Profile & Preferences ── */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Profile & Preferences</h2>
            <p className="text-xs text-gray-400">Personalize your identity and app experience</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60"
                placeholder="Your Name"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  Email Address
                </label>
                {user?.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                  >
                    <Mail size={12} /> {resendingEmail ? "Sending..." : "Verify Now"}
                  </button>
                )}
              </div>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full bg-[#080d1a]/50 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Appearance Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "dark", label: "Dark (Pro)", icon: Moon },
                { id: "light", label: "Light", icon: Sun },
                { id: "system", label: "System", icon: Laptop },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    theme === id
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm"
                      : "bg-[#080d1a] border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notification & Sound Toggles */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#080d1a] border border-white/5">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-gray-400" />
                <div>
                  <span className="block text-xs font-bold text-white">Audio Alert Chime</span>
                  <span className="block text-[11px] text-gray-400">Play a subtle audio tone when alerts trigger</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={alertSound}
                onChange={(e) => setAlertSound(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#080d1a] border border-white/5">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-gray-400" />
                <div>
                  <span className="block text-xs font-bold text-white">Email Notifications</span>
                  <span className="block text-[11px] text-gray-400">Send instant market alerts to your verified email</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {savingSettings ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </Card>

      {/* ── Section 2: Security & Password ── */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Security & Password</h2>
            <p className="text-xs text-gray-400">Protect your account and control active device sessions</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleLogoutAll}
              className="text-xs font-bold text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={13} />
              Logout of All Devices
            </button>

            <button
              type="submit"
              disabled={changingPassword}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </Card>

      {/* ── Section 3: Privacy & Data (DPDP Act 2023) ── */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Data Privacy & Portability</h2>
            <p className="text-xs text-gray-400">Under the Digital Personal Data Protection Act 2023</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export Data */}
          <div className="p-4 rounded-xl bg-[#080d1a] border border-white/5 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download size={15} className="text-emerald-400" />
                Export Personal Data
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Download a complete JSON export of your alerts, watchlist, portfolio, and profile data.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs transition-colors disabled:opacity-50"
            >
              {exporting ? "Generating Export..." : "Download Data Archive (.json)"}
            </button>
          </div>

          {/* Delete Account */}
          <div className="p-4 rounded-xl bg-rose-500/[0.04] border border-rose-500/15 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Trash2 size={15} />
                Delete Account
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Permanently erase your account and all associated portfolios, alerts, and watchlists.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors"
            >
              Request Erasure
            </button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e1626] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Delete Account?</h3>
                <p className="text-xs text-gray-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              All your active price alerts, watchlists, portfolio transaction history, and account records will be permanently purged from our servers.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Confirm your password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
