import express from "express";
import { dbConnect } from "./configs/db.js";
import { config } from "dotenv";
import userRouter from "./routes/user.routes.js";

config({ quiet: true });
const app = express();
const PORT = process.env.PORT || 8090;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/auth", userRouter);



app.listen(PORT, (err) => {
  if (!err) {
    console.log(`Server Started At: http://localhost:${PORT}`);
    dbConnect();
  } else {
    console.log(err);
  }
});
