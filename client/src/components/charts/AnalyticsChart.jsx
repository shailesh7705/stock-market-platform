import Card from "../ui/Card";

function AnalyticsChart() {

  return (

    <Card className="lg:col-span-5">

      <div
        className="

          h-full

          min-h-97.5

          flex flex-col

          items-center justify-center

          text-center

          px-8

        "
      >

        <div
          className="

            w-20 h-20

            rounded-3xl

            bg-green-500/10

            flex items-center justify-center

            mb-6

          "
        >

          <div
            className="

              w-10 h-10

              rounded-full

              bg-green-500

            "
          />

        </div>

        <h2
          className="

            text-3xl

            font-bold

            text-white

          "
        >

          Portfolio Analytics

        </h2>

        <p
          className="

            text-gray-400

            mt-4

            max-w-md

            leading-relaxed

          "
        >

          Advanced portfolio tracking, realtime profit & loss,
          investment analytics, and AI-powered insights
          are currently under development.

        </p>

        <div
          className="

            mt-8

            px-5 py-2

            rounded-full

            bg-green-500/10

            text-green-400

            text-sm

            font-medium

          "
        >

          Coming Soon

        </div>

      </div>

    </Card>

  );

}

export default AnalyticsChart;