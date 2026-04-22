import jwt from "jsonwebtoken";
import { config } from "dotenv";
import UserModel from "../models/user.model.js";
config();

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    if (!token)
      return res.status(400).json({
        success: false,
        message: "Invalid or Empty Token",
      });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({
          success: false,
          message: "Token Expired",
        });
        return res.status(400).json({
          success: false,
          message: "Token Verification failed",
        });
      }
    }
    const user = await UserModel.findById(decoded.id);
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    req.user = user;
    next();
  } catch (error) {
    console.log(`isAuthenticated middleware error`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
