import Card from "../ui/Card";

import {

  TrendingUp,
  TrendingDown,
  Newspaper,
  Activity

} from "lucide-react";

import {

  motion

} from "framer-motion";

function StockInsights({

  stock

}) {

  const positive = stock?.positive;

  const sentiment = positive

    ? "Bullish"

    : "Bearish";

  const sentimentColor = positive

    ? "text-green-400"

    : "text-red-400";

  const bgColor = positive

    ? "bg-green-500/10"

    : "bg-red-500/10";

  return (

    <div className="space-y-6">

      {/* Sentiment Card */}
      <Card>

        <div className="flex items-center justify-between mb-6">

          <div>

            <h2 className="text-lg font-bold">

              Market Sentiment

            </h2>

            <p className="text-xs text-gray-500 mt-1">

              AI-powered market signal

            </p>

          </div>

          <div
            className={`

              w-12 h-12

              rounded-2xl

              flex items-center justify-center

              ${bgColor}

            `}
          >

            {positive

              ? <TrendingUp
                  size={22}
                  className="text-green-400"
                />

              : <TrendingDown
                  size={22}
                  className="text-red-400"
                />

            }

          </div>

        </div>

        {/* Signal */}
        <div
          className={`

            inline-flex items-center gap-2

            px-3 py-2

            rounded-xl

            text-sm font-medium

            ${bgColor}
            ${sentimentColor}

          `}
        >

          <Activity size={15} />

          {sentiment}

        </div>

        {/* Insight */}
        <p
          className="

            text-sm

            text-gray-300

            leading-relaxed

            mt-5

          "
        >

          {positive

            ? `${stock?.symbol} is showing strong momentum with increasing buying activity and positive short-term investor sentiment.`

            : `${stock?.symbol} is facing selling pressure due to weaker short-term market sentiment and cautious investor positioning.`

          }

        </p>

      </Card>

      {/* Market News */}
      <Card>

        <div className="flex items-center gap-3 mb-6">

          <div
            className="

              w-10 h-10

              rounded-2xl

              bg-blue-500/10

              flex items-center justify-center

              text-blue-400

            "
          >

            <Newspaper size={18} />

          </div>

          <div>

            <h2 className="text-lg font-bold">

              Latest Market Insights

            </h2>

            <p className="text-xs text-gray-500 mt-1">

              Real-time market intelligence

            </p>

          </div>

        </div>

        {/* News Cards */}
        <div className="space-y-4">

          {[

            {
              title:
                positive

                  ? "Strong institutional buying activity detected"

                  : "Short-term market weakness impacts momentum",

              time: "2h ago"
            },

            {
              title:
                positive

                  ? "Technical indicators remain positive for near term"

                  : "Investors remain cautious amid market volatility",

              time: "5h ago"
            },

            {
              title:
                positive

                  ? "Sector momentum supports bullish continuation"

                  : "Profit booking observed across related sectors",

              time: "8h ago"
            }

          ].map((news, index) => (

            <motion.div

              key={index}

              whileHover={{
                x: 4
              }}

              className="

                rounded-2xl

                border border-white/4

                bg-white/3

                p-4

                cursor-pointer

                transition-all

              "

            >

              <p
                className="

                  text-sm

                  leading-relaxed

                  text-white

                "
              >

                {news.title}

              </p>

              <p className="text-xs text-gray-500 mt-3">

                {news.time}

              </p>

            </motion.div>

          ))}

        </div>

      </Card>

    </div>

  );

}

export default StockInsights;