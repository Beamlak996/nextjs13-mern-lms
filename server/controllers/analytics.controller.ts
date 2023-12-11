import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import { userModel } from "../models/user.model";
import CourseModel from "../models/course.model";
import { OrderModel } from "../models/order.model";


// get users analytics --only for admin\
export const getUsersAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const users = await generateLast12MonthsData(userModel)

            res.status(201).json({
                success: true,
                users
            })
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))
        }
    }
)


// get orders analytics --only for admin\
export const getOrdersAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const orders = await generateLast12MonthsData(OrderModel)

            res.status(201).json({
                success: true,
                orders
            })
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))
        }
    }
)


// get courses analytics --only for admin\
export const getCoursesAnalytics = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courses = await generateLast12MonthsData(CourseModel)

            res.status(201).json({
                success: true,
                courses
            })
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))
        }
    }
)