import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmailOtp(toEmail, otp, mobileNumber) {
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", Boolean(process.env.EMAIL_PASS));

  await transporter.sendMail({
    from: `"ShopSaathi" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your ShopSaathi Login OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2 style="margin-bottom: 8px;">ShopSaathi Login OTP</h2>

        <p style="margin: 0 0 12px;">
          OTP requested for mobile number:
          <strong>${mobileNumber || "Not provided"}</strong>
        </p>

        <p>Your One-Time Password is:</p>

        <h1 style="
          letter-spacing: 4px;
          background: #f4f6f8;
          padding: 12px 16px;
          display: inline-block;
          border-radius: 6px;
        ">
          ${otp}
        </h1>

        <p style="margin-top: 12px;">
          This OTP is valid for <strong>5 minutes</strong>.
        </p>

        <hr style="margin: 16px 0;" />

        <p style="font-size: 12px; color: #666;">
          If you did not request this OTP, please ignore this email.
        </p>
      </div>
    `,
  });
}
