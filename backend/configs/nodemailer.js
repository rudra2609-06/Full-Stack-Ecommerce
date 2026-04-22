import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

export const verifyEmail = (token, email) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailConfigurations = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Email Verification Link",
    //TODO: add production frontend url after deployment
    
    text: `As,You Recently visited our website we are ready to share with you a verification link ${process.env.NODE_ENV === "dev" ? `http://localhost:5173/verify/${token}` : null}`,
  };

  transporter.sendMail(mailConfigurations, (err, info) => {
    if (err) {
      throw Error(err);
    } else {
      console.log("Email Sent Successfully");
    }
  });
};
