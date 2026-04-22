import mongoose from "mongoose";
import { config } from "dotenv";

config();

export const dbConnect = async () => {
  try {
    await mongoose.connect(`${process.env.DB_URI}/ecommerce`);
    console.log("Db connected");
  } catch (error) {
    console.log("Db error");
    console.log(error.message);
  }
};
