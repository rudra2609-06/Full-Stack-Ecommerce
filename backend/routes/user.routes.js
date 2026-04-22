import { Router } from "express";
import { login, register, reVerify, verifyUser } from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/verify", verifyUser);
userRouter.post("/reverify",reVerify);
userRouter.post("/login",login)
userRouter.post("/logout",isAuthenticated,lo)

export default userRouter;
