import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-black tracking-tight">404</p>
      <h1 className="mt-3 text-xl font-bold">This page doesn't exist</h1>
      <p className="mt-2 text-sm text-gray-400 max-w-sm">The link may be out of date, or the page was never part of StockPulse.</p>
      <Link to="/" className="mt-6 h-11 px-5 rounded-xl bg-emerald-500 text-black text-sm font-extrabold inline-flex items-center">
        Go home
      </Link>
    </div>
  );
}
