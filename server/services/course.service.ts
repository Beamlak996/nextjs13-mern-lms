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

// Get all courses
export const getAllCoursesService = async (res: Response) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    courses
  })
}