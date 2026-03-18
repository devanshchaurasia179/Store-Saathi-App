import Business from "../models/Business.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/* ================= HELPERS ================= */

// Generate 6-digit OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Generate JWT
function generateToken(businessId) {
  return jwt.sign(
    { businessId },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "365d" }
  );
}

// Generate SHORT secret key
function generateRawSecretKey(businessId) {
  const hash = crypto
    .createHash("sha256")
    .update(businessId)
    .digest("hex");

  return `SS-${hash.substring(0, 8).toUpperCase()}`;
}

/* =====================================================
   SEND OTP
===================================================== */
export async function sendOtp(req, res) {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    let business = await Business.findOne({ mobileNumber });

    if (!business) {
      business = await Business.create({
        mobileNumber,
        businessName: "My Business",
        ownerName: "Owner",
      });
    }

    const otp = generateOtp();
    business.otp = otp;
    business.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await business.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "devanshchaurasia2410@gmail.com",
        pass: process.env.NODEMAILER_PASS,
      },
    });

    await transporter.sendMail({
      from: '"ProductName OTP" <otp@storesaathi.dev>',
      to: "devanshshopsaathi@gmail.com",
      subject: "Your ProductName Login OTP",
      text: `Your OTP is ${otp}. Valid for 5 minutes. ${mobileNumber}`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

/* =====================================================
   VERIFY OTP & LOGIN
===================================================== */
export async function verifyOtp(req, res) {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res.status(400).json({
        message: "Mobile number and OTP required",
      });
    }

    // Include secretKey in the selection to check if it already exists
    const business = await Business.findOne({ mobileNumber })
      .select("+otp +otpExpiresAt +secretKey");

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // 1. Verify the OTP using the model method
    const isValid = await business.verifyOtp(otp);
    if (!isValid) {
      return res.status(401).json({
        message: "Invalid or expired OTP",
      });
    }

    // 2. Handle the Secret Key logic
    let rawSecretKey = null;
    
    // If the business doesn't have a secret key yet (first time login), generate one
    if (!business.secretKey) {
      rawSecretKey = generateRawSecretKey(business._id.toString());
      business.secretKey = rawSecretKey; 
      // Note: Your pre-save hook in the model will automatically hash this before saving
      await business.save();
    }

    // 3. Generate Auth Token
    const token = generateToken(business._id);

    // 4. Set Cookie (Web Support)
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    // 5. Send Response
    res.status(200).json({
      success: true,
      token,               // For Mobile App / Postman
      business,
      secretKey: rawSecretKey, // Will be null if already generated previously, or the string if new
    });
    
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
/* =====================================================
   LOGIN WITH SECRET KEY
===================================================== */
export async function loginWithSecretKey(req, res) {
  try {
    const { mobileNumber, secretKey } = req.body;

    if (!mobileNumber || !secretKey) {
      return res.status(400).json({
        message: "Mobile number and secret key are required",
      });
    }

    const business = await Business.findOne({ mobileNumber })
      .select("+secretKey");

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const isValid = await business.verifySecretKey(secretKey);
    if (!isValid) {
      return res.status(401).json({
        message: "Invalid secret key or Mobile Number",
      });
    }

    const token = generateToken(business._id);

    // ✅ RESTORE COOKIE (WEB SUPPORT)
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token,   // 📱 App / Postman
      business,
    });
  } catch (error) {
    console.error("Secret Login Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
/* =====================================================
   SET ANALYTICS PIN (FIRST TIME)
===================================================== */
export async function setAnalyticsPin(req, res) {
  try {
    const businessId = req.user._id;
    const { analyticsPin } = req.body;

    if (!analyticsPin) {
      return res.status(400).json({
        message: "Analytics PIN is required",
      });
    }

    const business = await Business.findById(businessId)
      .select("+analyticsPin");

    if (business.analyticsPin) {
      return res.status(400).json({
        message: "Analytics PIN already set. Use update instead.",
      });
    }

    business.analyticsPin = analyticsPin;
    await business.save();

    res.status(200).json({
      success: true,
      message: "Analytics PIN set successfully",
    });
  } catch (error) {
    console.error("Set Analytics PIN Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
/* =====================================================
   RESET SECRET KEY (via Analytics PIN)
===================================================== */
export async function resetSecretKey(req, res) {
  try {
    const businessId = req.user._id;
    const { analyticsPin } = req.body;

    if (!analyticsPin) {
      return res.status(400).json({
        message: "Analytics PIN is required",
      });
    }

    // Include the necessary hidden fields
    const business = await Business.findById(businessId)
      .select("+analyticsPin +secretKey");

    if (!business) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // 1. Verify the PIN
    const isPinValid = await business.verifyAnalyticsPin(analyticsPin);
    if (!isPinValid) {
      return res.status(401).json({
        message: "Invalid PIN",
      });
    }

    // 2. Generate a NEW raw secret key
    // Added Date.now() to the hash input to ensure the reset key is 
    // actually different from the previous one.
    const rawSecret = generateRawSecretKey(business._id.toString() + Date.now());

    // 3. Assign the RAW string to the business object
    // DO NOT hash it here. Let the pre-save hook in Business.js handle the hashing.
    business.secretKey = rawSecret; 
    
    await business.save();

    // 4. Return the RAW key to the user
    res.status(200).json({
      success: true,
      secretKey: rawSecret, // This is the only time they will see this string!
      message: "Secret key reset successfully. Please save it securely.",
    });
  } catch (error) {
    console.error("Reset Secret Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

/* =====================================================
   VERIFY ANALYTICS PIN (UNLOCK ANALYTICS VIEW)
===================================================== */
export async function verifyAnalyticsPin(req, res) {
  try {
    const businessId = req.user._id;
    const { analyticsPin } = req.body;

    if (!analyticsPin) {
      return res.status(400).json({
        message: "Analytics PIN is required",
      });
    }

    const business = await Business.findById(businessId)
      .select("+analyticsPin");

    if (!business || !business.analyticsPin) {
      return res.status(404).json({
        message: "Analytics PIN not set",
      });
    }

    const isValid = await business.verifyAnalyticsPin(analyticsPin);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid Analytics PIN",
      });
    }

    res.status(200).json({
      success: true,
      message: "Analytics unlocked",
    });
  } catch (error) {
    console.error("Verify Analytics PIN Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
/* =====================================================
   SEND OTP FOR ANALYTICS PIN RESET
===================================================== */
export async function sendAnalyticsPinResetOtp(req, res) {
  try {
    const businessId = req.user._id;
    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const otp = generateOtp();
    business.otp = otp;
    business.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await business.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "devanshchaurasia2410@gmail.com",
        pass: process.env.NODEMAILER_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Store Saathi Security" <security@storesaathi.dev>',
      to: "devanshshopsaathi@gmail.com",
      subject: "OTP to Reset Analytics PIN",
      text: `Your OTP to reset Analytics PIN is ${otp}. Valid for 5 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent for PIN reset",
    });
  } catch (error) {
    console.error("Send PIN Reset OTP Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

/* =====================================================
   UPDATE ANALYTICS PIN
===================================================== */
export async function updateAnalyticsPin(req, res) {
  try {
    const businessId = req.user._id;
    const { oldPin, newPin } = req.body;

    if (!oldPin || !newPin) {
      return res.status(400).json({
        message: "Old PIN and New PIN are required",
      });
    }

    const business = await Business.findById(businessId)
      .select("+analyticsPin");

    const isValid = await business.verifyAnalyticsPin(oldPin);
    if (!isValid) {
      return res.status(401).json({
        message: "Invalid old Analytics PIN",
      });
    }

    business.analyticsPin = newPin;
    await business.save();

    res.status(200).json({
      success: true,
      message: "PIN updated successfully",
    });
  } catch (error) {
    console.error("Update Analytics PIN Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}
/* =====================================================
   VERIFY OTP & RESET ANALYTICS PIN (WITH LOCKOUT)
===================================================== */
export async function resetAnalyticsPinWithOtp(req, res) {
  try {
    const businessId = req.user._id;
    const { otp, newPin } = req.body;

    if (!otp || !newPin) {
      return res.status(400).json({
        message: "OTP and new PIN are required",
      });
    }

    const business = await Business.findById(businessId).select(
      "+otp +otpExpiresAt +analyticsPin +analyticsPinOtpAttempts +analyticsPinOtpBlockedUntil"
    );

    if (!business) {
      return res.status(404).json({ message: "Shop not found" });
    }

    /* ================= BLOCK CHECK ================= */
    if (
      business.analyticsPinOtpBlockedUntil &&
      business.analyticsPinOtpBlockedUntil > new Date()
    ) {
      const minutesLeft = Math.ceil(
        (business.analyticsPinOtpBlockedUntil - Date.now()) / (1000 * 60)
      );

      return res.status(429).json({
        message: `Too many invalid attempts. Try again in ${minutesLeft} minutes.`,
      });
    }

    /* ================= OTP VERIFY ================= */
    const isValid = await business.verifyOtp(otp);

    if (!isValid) {
      business.analyticsPinOtpAttempts =
        (business.analyticsPinOtpAttempts || 0) + 1;

      // 🚫 BLOCK AFTER 5 FAILURES
      if (business.analyticsPinOtpAttempts >= 5) {
        business.analyticsPinOtpBlockedUntil = new Date(
          Date.now() + 1 * 60 * 60 * 1000 // 6 hours
        );
        business.analyticsPinOtpAttempts = 0; // reset counter after block
      }

      await business.save();

      return res.status(401).json({
        message: "Invalid or expired OTP",
      });
    }

    /* ================= SUCCESS ================= */
    business.analyticsPin = newPin;

    // ✅ Clear OTP + reset security counters
    business.otp = undefined;
    business.otpExpiresAt = undefined;
    business.analyticsPinOtpAttempts = 0;
    business.analyticsPinOtpBlockedUntil = undefined;

    await business.save();

    res.status(200).json({
      success: true,
      message: "Analytics PIN reset successfully",
    });
  } catch (error) {
    console.error("Reset Analytics PIN Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}



/* =====================================================
   ONBOARD SHOP
===================================================== */
export async function onboard(req, res) {
  try {
    const businessId = req.user._id;

    const {
      businessName,
      ownerName,
      gstNumber = "",
      businessCategory = "",
      upiId = "",
      location = "",
    } = req.body;

    if (!businessName || !ownerName) {
      return res.status(400).json({
        message: "Shop name and owner name are required",
      });
    }

    const completionFields = {
      businessName,
      ownerName,
      businessCategory,
      upiId,
      location,
    };

    const filledFields = Object.values(completionFields).filter(
      (v) => v && v.toString().trim() !== ""
    ).length;

    const profileCompletion = Math.round(
      (filledFields / Object.keys(completionFields).length) * 100
    );

    const business = await Business.findByIdAndUpdate(
      businessId,
      {
        businessName,
        ownerName,
        gstNumber,
        businessCategory,
        upiId,
        location,
        profileCompletion,
        isOnboarded: profileCompletion === 100,
      },
      { new: true }
    );

    res.status(200).json({ success: true, business });
  } catch (error) {
    console.error("Onboarding Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/* =====================================================
   LOGOUT
===================================================== */
export function logout(req, res) {
  // Optional: clear cookie for web
  res.clearCookie("jwt");

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
}
