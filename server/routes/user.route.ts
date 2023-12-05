import express from "express";
import { activateUser, registrationUesr } from "../controllers/user.controller";

const userRouter = express.Router()

//register route 
userRouter.post("/registration", registrationUesr)

// activate user
userRouter.post("/activate-user", activateUser)

export default userRouter