import UserModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { config } from "dotenv";
import { verifyEmail } from "../configs/nodemailer.js";

config();

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({
        success: false,
        message: "All Fields Required",
      });
    const user = await UserModel.findOne({ email });
    if (user)
      return res.status(400).json({
        success: false,
        message: "User Already Exists.Please Login",
      });
    const hash = await argon2.hash(password);
    const newUser = await UserModel.create({ ...req.body, password: hash });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    verifyEmail(token, newUser?.email);
    newUser.token = token;

    newUser.save();

    const { password: _, ...userWithoutPassword } = newUser.toObject();
    return res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.log(`Register Controller Error`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.Please Try Again",
    });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(400).json({
        success: false,
        message: "Auth token missing or invalid",
      });
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({
          success: false,
          message: "Token Expired",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Token Verification failed",
      });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    user.token = null;
    user.isVerified = true;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Email Verified Successfully",
    });
  } catch (error) {
    console.log(`verify Controller Error`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.Please Try Again",
    });
  }
};

export const reverify 