import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import { sendMail } from "../utils/sendMail";
import { NotificationModel } from "../models/notification.model";

// upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      // Edit thumbnail
      if (thumbnail) {
        // destory the previous thumbnail
        await cloudinary.v2.uploader.destroy(thumbnail?.public_id);

        // add a new one
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
      }

      const courseId = req.params.id;

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get single course -- without purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const isCachedExist = await redis.get(courseId);

      if (isCachedExist) {
        const course = JSON.parse(isCachedExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set(courseId, JSON.stringify(course));

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all courses -- without purchasing
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCachedExist = await redis.get("allCourses");
      if (isCachedExist) {
        const courses = JSON.parse(isCachedExist);
        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );

        await redis.set("allCourses", JSON.stringify(courses));

        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


// get course content -- only for valid user
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses
      const courseId = req.params.id

      const courseExists = userCourseList?.find((course: any) => course._id.toString() === courseId.toString())

      if(!courseExists) {
        return next(new ErrorHandler("You are not eligable to access this course", 400))
      }

      const course = await CourseModel.findById(courseId)

      const content = course?.courseData

      res.status(200).json({
        success: true,
        content
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }
  } 
)

// add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body as IAddQuestionData
      const course = await CourseModel.findById(courseId)

      if(!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400))
      }

      const courseContent = course?.courseData.find((item: any) => item._id.toString() === contentId)
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      // create new question
      const newQuestion: any = {
        user: req.user,
        question,
        quesitonReplies: [],
      };

      // add quesion to course content
      courseContent.questions.push(newQuestion)

      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Recived",
        message: `You have a new question in "${courseContent.title}"`,
      });


      await course?.save()

      res.status(200).json({
        success: true,
        course
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// add answer to course question
interface IAddAnswerData {
  answer: string
  contentId: string
  courseId: string
  questionId: string
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, contentId, courseId, questionId }: IAddAnswerData = req.body
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData.find(
        (item: any) => item._id.toString() === contentId
      );
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = courseContent?.questions?.find((item:any) => item._id === questionId)
      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }

      // create new answer object
      const newAnswer: any = {
        user: req.user,
        answer
      }

      // add this answer to our course content
      question.questionReplies?.push(newAnswer)

      await course?.save()

      if(req.user?._id === question.user?.id) {
        // create a notification
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Recived",
          message: `You have a new question reply in "${courseContent.title}"`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title
        }

        const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data) 

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400))
        }
      }

      res.status(200).json({
        success: true,
        course
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// add review in course
interface IAddReviewData {
  review: string
  rating: number
  userId: string
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses
      const courseId = req.params.id

      const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId)

      if(!courseExists) {
        return next(new ErrorHandler("You are not eligable to access this course", 400))
      }

      const course = await CourseModel.findById(courseId)

      const { review, rating } = req.body as IAddReviewData

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating
      }

      course?.reviews.push(reviewData)

      let avg = 0

      course?.reviews.forEach((review)=> {
        avg += review.rating
      })
      if(course) {
        course.ratings = avg / course.reviews.length
      }

      await course?.save()

      const notification = {
        title: "New Review Recevied",
        message: `${req.user?.name} has given a review on your course ${course?.name}.`
      }

      // create notification
      await NotificationModel.create({
        user: req.user?._id,
        notification,
      });


      res.status(200).json({
        success: true,
        course
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// add reply to review
interface IAddReviewData {
  comment: string
  courseId: string
  reviewId: string
}

export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewData
      const course = await CourseModel.findById(courseId)

      if(!course) {
        return next(new ErrorHandler("Course not found", 404))
      }

      const review = course?.reviews.find((review: any)=> review._id.toString() === reviewId)

      if(!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const replyData: any = {
        user: req.user,
        comment
      }

      if(!review.commentReplies) {
        review.commentReplies = []
      }

      review.commentReplies?.push(replyData)

      await course?.save()

      res.status(201).json({
        success: true,
        course
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

// get all courses --only for admin
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete course --only for admin
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      const course = await CourseModel.findById(id)
      if(!course) {
        return next(new ErrorHandler("Course not found", 404))
      }

      await course.deleteOne({id})
      await redis.del(id)

      res.status(201).json({
        success: true,
        message: "Course successfully deleted."
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
)
