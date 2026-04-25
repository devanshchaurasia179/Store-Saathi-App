import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import ledgerRoutes from "./routes/ledger.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import productRoutes from "./routes/product.routes.js";
import billRoutes from "./routes/bill.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import membershipRoutes from "./Membership_Backend/routes/auth.routes.js";
import MembershipPlan from "./Membership_Backend/routes/membershipPlan.routes.js";
import MembershipCustomer from "./Membership_Backend/routes/customer.routes.js";
import Subscriptions from "./Membership_Backend/routes/subscription.routes.js";
import { initBillCleanupScheduler } from "./config/billCleanupScheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


const __dirname = path.resolve();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

  
  app.use(express.json());
  app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/dashboard", dashboardRoutes);
// ...
app.use("/api/analytics", analyticsRoutes);

//Membership
app.use("/api/membership/auth", membershipRoutes);
app.use("/api/membership/plans", MembershipPlan);
app.use("/api/membership/customer", MembershipCustomer);
app.use("/api/membership/subscription", Subscriptions);




app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

connectDB();

// Initialize bill cleanup scheduler
initBillCleanupScheduler();

app.listen(PORT,"0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
