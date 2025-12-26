import jwt from "jsonwebtoken";
import Shop from "../models/Shop.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Invalid token" });
    }

    const shop = await Shop.findById(decoded.shopId);

    if (!shop) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Shop not found" });
    }

    req.user = shop; // keeping same naming style as before
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
