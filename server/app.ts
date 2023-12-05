import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { ErrorMiddleware } from "./middleware/error"

require("dotenv").config()

export const app = express()

app.use(express.json({limit: "50mb"}))
app.use(cookieParser())
app.use(cors({
    origin: process.env.ORIGIN
}))

app.get("/test", (req: Request, res: Response, next: NextFunction)=> {
    res.status(200).json({
        success: true,
        message: "API is working"
    })
})

// unknown routes
app.all("*", (req: Request, res: Response, next: NextFunction)=> {
    const error = new Error(`Route ${req.originalUrl} not found`) as any
    error.statusCode = 404
    next(error)
})

app.use(ErrorMiddleware)