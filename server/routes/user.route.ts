import express from "express";
import { registrationUesr } from "../controllers/user.controller";

const userRouter = express.Router()

userRouter.post("/registration", registrationUesr)

export default userRouter