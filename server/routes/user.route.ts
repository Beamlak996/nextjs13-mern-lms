import express from "express";
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUesr,
  socialAuth,
  updateAccessToken,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();

//register route
userRouter.post("/registration", registrationUesr);

// activate user
userRouter.post("/activate-user", activateUser);

// login user
userRouter.post("/login", loginUser);

// logout user
userRouter.get("/logout", isAuthenticated, logoutUser);

// update access token
userRouter.get("/refresh", updateAccessToken);

// my information
userRouter.get("/me", isAuthenticated, getUserInfo);

// social auth
userRouter.post("/social-auth", socialAuth);

export default userRouter;
