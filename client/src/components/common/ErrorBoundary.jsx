import { Component } from "react";
import { AlertOctagon, RefreshCw, Home, ChevronDown } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    if (typeof window !== "undefined" && window.__SENTRY__) {
      try {
        window.__SENTRY__.captureException(error, { extra: errorInfo });
      } catch {}
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-[#0d1424] p-8 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertOctagon size={32} />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">Terminal Error Detected</h1>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              StockPulse encountered an unexpected interface error. Your session data is intact.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-xs hover:brightness-110 transition shadow-lg"
              >
                <RefreshCw size={14} /> Reload Interface
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition"
              >
                <Home size={14} /> Dashboard
              </button>
            </div>

            <button
              type="button"
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 mx-auto transition"
            >
              Technical details <ChevronDown size={12} className={this.state.showDetails ? "rotate-180" : ""} />
            </button>

            {this.state.showDetails && (
              <pre className="mt-3 p-3 rounded-xl bg-black/50 border border-white/5 text-[10px] text-left text-red-300 font-mono overflow-x-auto max-h-36">
                {this.state.error?.stack || this.state.error?.message || "Unknown error"}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
