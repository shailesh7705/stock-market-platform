const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const registerUser = async (req, res) => {

  try {

    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User registered successfully"
    });
    

  } catch (error) {

    res.status(500).json({
      message: "Server Error"
    });

  }

};
const loginUser = async (req, res) => {

  try {

    const {

      email,
      password

    } = req.body;

    const user = await User.findOne({

      email

    });

    if (!user) {

      return res.status(400).json({

        message: "Invalid Credentials"

      });

    }

    const isMatch = await bcrypt.compare(

      password,

      user.password

    );

    if (!isMatch) {

      return res.status(400).json({

        message: "Invalid Credentials"

      });

    }

    const token = jwt.sign(

      {

        id: user._id

      },

      process.env.JWT_SECRET,

      {

        expiresIn: "7d"

      }

    );

    res.status(200).json({

      message: "Login Successful",

      token,

      user: {

        id: user._id,

        name: user.name,

        email: user.email

      }

    });

  } catch (error) {

    res.status(500).json({

      message: "Server Error"

    });

  }

};
module.exports = {
  registerUser,
  loginUser
};