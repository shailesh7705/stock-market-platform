const cron = require("node-cron");

const YahooFinance = require("yahoo-finance2").default;

const yahooFinance = new YahooFinance();

const Alert = require("../models/Alert");

const Notification = require("../models/Notification");

const sendEmail = require("./sendEmail");

const User = require("../models/User");

const startAlertEngine = () => {

  cron.schedule("* * * * *", async () => {

    console.log("Checking Alerts...");

    const alerts = await Alert.find({
      triggered: false
    });

    for (const alert of alerts) {

      try {

        const stock = await yahooFinance.quote(
          alert.symbol
        );

        const currentPrice =
          stock.regularMarketPrice;

        console.log(
          `${alert.symbol}: ${currentPrice}`
        );

        if (currentPrice <= alert.targetPrice) {
           alert.triggered = true;

          await alert.save();
          await Notification.create({
            user: alert.user,
            message:
                `${alert.symbol} reached target price ₹${alert.targetPrice}`
              });
          const user = await User.findById(
              alert.user
              );

            await sendEmail(
              user.email,
              "Stock Alert Triggered 🚀",
              `${alert.symbol} has reached your target price of ₹${alert.targetPrice}`
              );
    console.log(
            `ALERT TRIGGERED FOR ${alert.symbol}`
          );

        }

      } catch (error) {

        console.log(error);

      }

    }

  });

};

module.exports = startAlertEngine;