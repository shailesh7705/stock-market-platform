const Alert = require("../models/Alert");

/* Create Alert */
const createAlert = async (req, res) => {

  try {

    const {

      symbol,
      targetPrice

    } = req.body;

    const alert = await Alert.create({

      user: req.user,

      symbol,

      targetPrice

    });

    res.status(201).json(alert);

  } catch (error) {

    res.status(500).json({

      message: "Server Error"

    });

  }

};

/* Get Alerts */
const getAlerts = async (req, res) => {

  try {

    const alerts = await Alert.find({

      user: req.user

    }).sort({

      createdAt: -1

    });

    res.status(200).json(alerts);

  } catch (error) {

    res.status(500).json({

      message: "Server Error"

    });

  }

};

/* Delete Alert */
const deleteAlert = async (req, res) => {

  try {

    const alert = await Alert.findById(

      req.params.id

    );

    if (!alert) {

      return res.status(404).json({

        message: "Alert not found"

      });

    }

    await alert.deleteOne();

    res.status(200).json({

      message: "Alert removed"

    });

  } catch (error) {

    res.status(500).json({

      message: "Server Error"

    });

  }

};

module.exports = {

  createAlert,

  getAlerts,

  deleteAlert

};