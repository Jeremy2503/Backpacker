// routes/authRoutes.js
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = mongoose.model("users");
const requireLogin = require("../middleware/requireLogin");

const otpLength = 6;
const OTP_EXPIRY_MINUTES = 10;

module.exports = (app) => {
  // ============================================
  // UNIFIED LOGIN/REGISTER ENDPOINT
  // ============================================
  app.post("/api/v1/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email and password are required" 
        });
      }

      const user = await User.findOne({ email });

      // CASE 1: User exists with password - verify password
      if (user && user.password) {
        if (user.password === password) {
          const payload = {
            id: user._id,
            email: user.email,
          };

          const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
          });

          return res.status(200).json({ 
            message: "Login successful", 
            token,
            user: {
              id: user._id,
              email: user.email,
              name: user.name
            }
          });
        } else {
          return res.status(401).json({ 
            message: "Invalid email or password" 
          });
        }
      }

      // CASE 2: User doesn't exist - create new user and send OTP
      const digits = "0123456789";
      let newOTP = "";
      for (let i = 0; i < otpLength; i++) {
        newOTP += digits[Math.floor(Math.random() * 10)];
      }

      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + OTP_EXPIRY_MINUTES);

      try {
        // Create new user with OTP and temp password
        await User.create({ 
          email, 
          otp: newOTP,
          otpExpiry,
          tempPassword: password
        });

        console.log("OTP for", email, ":", newOTP); // Remove in production

        res.status(200).json({ 
          message: "OTP sent to your email. Please verify to complete registration.",
          requiresOTPVerification: true
        });
      } catch (createError) {
        // Handle duplicate email error (shouldn't happen if logic is correct, but safety check)
        if (createError.code === 11000) {
          return res.status(400).json({ 
            message: "Email already exists. Please try logging in." 
          });
        }
        throw createError; // Re-throw other errors
      }

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // VERIFY OTP & COMPLETE REGISTRATION
  // ============================================
  app.post("/api/v1/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ 
          message: "Email and OTP are required" 
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ 
          message: "User not found. Please try logging in again." 
        });
      }

      // Check if OTP is valid
      if (!user.otp || user.otp !== otp) {
        return res.status(401).json({ 
          message: "Invalid OTP" 
        });
      }

      // Check if OTP has expired
      if (user.otpExpiry && new Date() > user.otpExpiry) {
        return res.status(401).json({ 
          message: "OTP has expired. Please try logging in again." 
        });
      }

      // Check if tempPassword exists
      if (!user.tempPassword) {
        return res.status(400).json({ 
          message: "No pending registration found. Please try logging in again." 
        });
      }

      // OTP is valid - store the password (plain text for now)
      await User.updateOne(
        { email },
        {
          password: user.tempPassword, // Store password
          isEmailVerified: true,
          otp: null,
          otpExpiry: null,
          tempPassword: null
        }
      );

      // Generate JWT token
      const updatedUser = await User.findOne({ email });
      
      if (!updatedUser) {
        return res.status(500).json({ 
          message: "Error updating user" 
        });
      }

      const payload = {
        id: updatedUser._id,
        email: updatedUser.email,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      });

      res.status(200).json({
        message: "OTP verified successfully. Account created.",
        token,
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name
        }
      });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================
  // GET CURRENT USER (Protected Route)
  // ============================================
  app.get("/api/v1/auth/me", requireLogin, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password -otp -tempPassword");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ 
        message: "Current user", 
        user 
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  });
};