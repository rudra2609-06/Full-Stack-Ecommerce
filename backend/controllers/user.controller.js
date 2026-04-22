import UserModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { config } from "dotenv";
import { verifyEmail } from "../configs/nodemailer.js";
import SessionModel from "../models/session.model.js";

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
      expiresIn: "10m",
    });

    verifyEmail(token, newUser?.email);
    newUser.token = token;

    newUser.save();

    const { password: _, ...userWithoutPassword } = newUser.toObject();
    return res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      data: userWithoutPassword,
      token,
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

export const reVerify = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({
        success: false,
        message: "Email Required",
      });
    const user = await UserModel.findOne({ email });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    verifyEmail(token, email);
    user.token = token;
    user.save();
    return res.status(200).json({
      success: true,
      message: "Re-Verification Link Sent Successfully",
    });
  } catch (error) {
    console.log(`re-verify Controller Error`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.Please Try Again",
      token,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = await req.body;
    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "Required All Fields",
      });
    const user = await UserModel.findOne({ email });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User Not Found.Please Add Valid Credentials",
      });
    if (!(await argon2.verify(user.password, password))) {
      return res.status(200).json({
        success: false,
        message: "Invalid Email Or Password",
      });
    }

    if (!user.isVerified)
      return res.status(401).json({
        success: false,
        message: "You Are Unauthorized",
      });

    //generate token
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    user.isLoggedIn = true;
    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();

    //check for existing session
    const existingSession = await SessionModel.findOne({ userId: user._id });

    if (existingSession) {
      await SessionModel.deleteOne({ userId: user._id });
    }

    await SessionModel.create({ userId: user._id });

    return res.status(200).json({
      success: true,
      message: "User logged in Successfully",
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log(`login Controller Error`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.Please Try Again",
      token,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId)
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    await SessionModel.deleteMany({ userId });
    await UserModel.findByIdAndUpdate(userId, { isLoggedIn: false });
    return res.status(200).json({
      success: true,
      message: "User logged out Successfully",
    });
  } catch (error) {
    console.log(`logout Controller Error`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.Please Try Again",
      token,
    });
  }
};
