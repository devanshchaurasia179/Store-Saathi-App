import Shop from "../models/Shop.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";  // Add this import

// helper to generate OTP
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * SEND OTP
 * POST /auth/send-otp
 */
export async function sendOtp(req, res) {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    let shop = await Shop.findOne({ mobileNumber });

    if (!shop) {
      shop = await Shop.create({
        mobileNumber,
        shopName: "My Shop",
        ownerName: "Owner",
      });
    }

    const otp = generateOtp();
    shop.otp = otp;
    shop.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await shop.save();


const testAccount = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: 'devanshchaurasia2410@gmail.com',
        pass: 'vwhjdupjsnmyouny'
    }
});

    // Send the OTP email to your fixed dev email
    const info = await transporter.sendMail({
      from: '"Store Saathi OTP" <otp@storesaathi.dev>',
      to: "devanshshopsaathi@gmail.com",  // Your fixed email
      subject: "Your Store Saathi Login OTP",
      text: `Your OTP is: ${otp}\n\nValid for 5 minutes. Do not share it.`,
      html: `<h2>Your OTP: <strong>${otp}</strong> for ${mobileNumber}</h2>
             <p>Valid for 5 minutes.</p>`,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

/**
 * VERIFY OTP & LOGIN
 * POST /auth/verify-otp
 */
export async function verifyOtp(req, res) {
  try {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
      return res
        .status(400)
        .json({ message: "Mobile number and OTP required" });
    }

    const shop = await Shop.findOne({ mobileNumber }).select(
      "+otp +otpExpiresAt"
    );

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const isValid = await shop.verifyOtp(otp);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    const token = jwt.sign(
      { shopId: shop._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "Production",
    });

    res.status(200).json({ success: true, shop });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

/**
 * ONBOARD SHOP
 * POST /auth/onboard
 */
export async function onboard(req, res) {
  try {
    const shopId = req.user._id;

    const {
      shopName,
      ownerName,
      gstNumber = "",
      storeCategory = "",
      upiId = "",
      location = "",
    } = req.body;

    if (!shopName || !ownerName) {
      return res.status(400).json({
        message: "Shop name and owner name are required",
      });
    }

    /* ================= PROFILE COMPLETION ================= */
    // GST is OPTIONAL → excluded from calculation
    const completionFields = {
      shopName,
      ownerName,
      storeCategory,
      upiId,
      location,
    };

    const totalFields = Object.keys(completionFields).length;

    const filledFields = Object.values(completionFields).filter(
      (value) => value && value.toString().trim() !== ""
    ).length;

    const profileCompletion = Math.round(
      (filledFields / totalFields) * 100
    );
    /* ====================================================== */

    const shop = await Shop.findByIdAndUpdate(
      shopId,
      {
        shopName,
        ownerName,
        gstNumber,        // stored but not counted
        storeCategory,
        upiId,
        location,
        profileCompletion,
        isOnboarded: profileCompletion === 100,
      },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    console.error("Onboarding Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


/**
 * LOGOUT
 */
export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}
