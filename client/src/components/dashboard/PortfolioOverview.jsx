// client/src/components/dashboard/PortfolioOverview.jsx
import Card from "../ui/Card";
import { Bell, Bookmark, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import useAlertStore from "../../store/alertStore";
import useWatchlistStore from "../../store/watchlistStore";

function PortfolioOverview() {
  const { alerts } = useAlertStore();
  const { watchlist } = useWatchlistStore();

  const totalAlerts = alerts?.length || 0;
  const triggeredCount = alerts?.filter((a) => a.triggered).length || 0;
  const activeAlertsCount = totalAlerts - triggeredCount;
  const watchlistCount = watchlist?.length || 0;

  // Find top gainer in watchlist
  const positiveStocks = (watchlist || []).filter((s) => s.positive);

  const metrics = [
    {
      title: "Active Alerts",
      value: activeAlertsCount,
      sub: "Monitored every 60s via NSE cron",
      icon: Bell,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      link: "/alerts",
      badge: "Email Active",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Targets Hit",
      value: triggeredCount,
      sub: "Price conditions triggered & dispatched",
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      link: "/alerts",
      badge: `${triggeredCount} Hit`,
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Watchlist Tracked",
      value: watchlistCount,
      sub: `${positiveStocks.length} currently in profit today`,
      icon: Bookmark,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      link: "/watchlist",
      badge: "Realtime",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      title: "Market Status",
      value: "NSE Live",
      sub: "Trading hours 09:15 – 15:30 IST",
      icon: TrendingUp,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10 border-purple-500/20",
      link: "/dashboard#market-movers",
      badge: "Equities",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
  ];

  return (
    <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.title} to={item.link} className="block group">
            <Card className="p-4.5 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon size={18} />
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                  {item.title}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">
                    {item.value}
                  </h3>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
                  <span>{item.sub}</span>
                  <ArrowRight
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400"
                  />
                </p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default PortfolioOverview;
