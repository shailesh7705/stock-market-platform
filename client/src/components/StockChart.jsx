import {

  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer

} from "recharts";

function StockChart() {

  const data = [

    { day: "Mon", price: 3400 },

    { day: "Tue", price: 3440 },

    { day: "Wed", price: 3390 },

    { day: "Thu", price: 3500 },

    { day: "Fri", price: 3520 }

  ];

  return (

    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-10">

      <h2 className="text-3xl font-bold mb-8">

        TCS Weekly Trend

      </h2>

      <div className="w-full h-80">

        <ResponsiveContainer>

          <LineChart data={data}>

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="price"
              stroke="#22c55e"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

export default StockChart;