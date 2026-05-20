import Card from "../ui/Card";
import { Wallet, TrendingUp, PieChart, Bell } from "lucide-react";
import useAlertStore from "../../store/alertStore";
import { useNavigate } from "react-router-dom";

function PortfolioOverview() {
  const { alerts } = useAlertStore();
  const navigate = useNavigate();

  // FIX #7 — split active vs triggered
  const totalAlerts    = alerts?.length || 0;
  const triggeredCount = alerts?.filter((a) => a.triggered).length || 0;
  const activeCount    = totalAlerts - triggeredCount;

  const stats = [
    {
      title: "Portfolio Value",
      value: "Coming Soon",
      sub: "Advanced portfolio analytics arriving soon",
      icon: <Wallet size={18} />,
      iconBg: "bg-green-500/15",
      iconColor: "text-green-400",
      comingSoon: true,
    },
    {
      title: "Today's P&L",
      value: "Coming Soon",
      sub: "Realtime P&L tracking coming soon",
      icon: <TrendingUp size={18} />,
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      comingSoon: true,
    },
    {
      title: "Total Investment",
      value: "Coming Soon",
      sub: "Investment insights will be available soon",
      icon: <PieChart size={18} />,
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-400",
      comingSoon: true,
    },
    {
      title: "Active Alerts",
      value: totalAlerts,
      icon: <Bell size={18} />,
      iconBg: "bg-yellow-500/15",
      iconColor: "text-yellow-400",
      isAlerts: true,
    },
  ];

  return (
    <div className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((item, index) => (
        <Card
          key={index}
          // FIX #2 — tighter padding
          className="px-4 py-3"
          onClick={item.isAlerts ? () => document.getElementById("alerts")
            ?.scrollIntoView({ behavior: "smooth" }) : undefined}
          style={item.isAlerts ? { cursor: "pointer" } : undefined}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`${item.iconBg} ${item.iconColor} p-2 rounded-xl shrink-0`}>
              {item.icon}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-400 mb-1">{item.title}</p>

              {/* FIX #2 — smaller value text for coming soon */}
              <h2 className={`font-bold leading-tight
                ${item.comingSoon
                  ? "text-[15px] text-gray-400"
                  : "text-[22px] text-white"}`}>
                {item.value}
              </h2>

              {/* FIX #7 — alerts card shows split */}
              {item.isAlerts ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md
                                   bg-yellow-500/10 text-yellow-400">
                    {activeCount} active
                  </span>
                  {triggeredCount > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md
                                     bg-green-500/10 text-green-400">
                      {triggeredCount} hit
                    </span>
                  )}
                </div>
              ) : (
                item.sub && (
                  <p className="text-[10px] text-gray-600 mt-1 leading-snug">
                    {item.sub}
                  </p>
                )
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default PortfolioOverview;