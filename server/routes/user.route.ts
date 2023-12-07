import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  registrationUesr,
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
userRouter.get("/logout", logoutUser);

export default userRouter;
