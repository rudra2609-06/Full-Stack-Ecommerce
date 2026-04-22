import { Router } from "express";
import { register, verifyUser } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/verify", verifyUser);


export default userRouter;
