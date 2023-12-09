import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import CourseModel from "../models/course.model";


// create a course
export const createCourse = CatchAsyncError(
    async (data: any, res: Response) => {
        const course = await CourseModel.create(data)
        res.status(200).json({
            success: true,
            course 
        })
    }
) 