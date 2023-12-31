import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { LayoutModel } from "../models/layout.model";
import cloudinary from "cloudinary";



// create layout --only admin
export const createLayout = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.body

            const isTypeExist = await LayoutModel.findOne({type})

            if(isTypeExist) {
                return next(new ErrorHandler(`${type} already exists`, 400))
            }

            if(type === "Banner") {
                const { image, title, subTitle } = req.body
                const myCloud = await cloudinary.v2.uploader.upload(image, {
                    folder: "Layout"
                })

                const banner = {
                    image: {
                        public_id: myCloud.public_id,
                        url: myCloud.url
                    },
                    title,
                    subTitle
                }

                await LayoutModel.create(banner)
            }

            if(type === "FAQ") {
                const { faq } = req.body

                const faqItems = await Promise.all(
                    faq.map(async (item: any)=> {
                        return {
                            question: item.question,
                            answer: item.answer
                            
                        }
                    })
                )

                await LayoutModel.create({type: "FAQ",faq: faqItems})
            }

            if(type === "Categories") {
                const { categories } = req.body

                const categoryItem = await Promise.all(
                  categories.map(async (item: any) => {
                    return {
                      title: item.title,
                    };
                  })
                );

                await LayoutModel.create({ type: "Categories", categories: categoryItem }); 
            }


            res.status(201).json({
                success: true,
                message: "Layout created successfully"
            })
        } catch (error: any) {
           return next(new ErrorHandler(error.message, 400)) 
        }
    }
)


// edit layout --only admin
export const editLayout = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.body;

            if (type === "Banner") {
              const bannerData: any = await LayoutModel.findOne({ type: "Banner" })
              const { image, title, subTitle } = req.body;

              await cloudinary.v2.uploader.destroy(bannerData.image.public_id)

              const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "layout",
              })

              const banner = {
                image: {
                  public_id: myCloud.public_id,
                  url: myCloud.url,
                },
                title,
                subTitle,
              };

              await LayoutModel.findByIdAndUpdate(bannerData.id, {banner});
            }

            if (type === "FAQ") {
              const { faq } = req.body;

              const faqData = await LayoutModel.findOne({ type: "FAQ" });

              const faqItems = await Promise.all(
                faq.map(async (item: any) => {
                  return {
                    question: item.question,
                    answer: item.answer,
                  };
                })
              );

              await LayoutModel.findByIdAndUpdate(faqData?._id,{ type: "FAQ", faq: faqItems });
            }

            if (type === "Categories") {
              const { categories } = req.body;

              const categoryData = await LayoutModel.findOne({
                type: "Categories",
              });

              const categoryItem = await Promise.all(
                categories.map(async (item: any) => {
                  return {
                    title: item.title,
                  };
                })
              );

              await LayoutModel.findByIdAndUpdate(categoryData?.id,{
                type: "Categories",
                categories: categoryItem,
              });
            }

            res.status(201).json({
              success: true,
              message: "Layout updated successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400)); 
        }
    }
)

// get layout by type
export const getLayoutByType = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.body
            const layout = await LayoutModel.findOne({type})
            res.status(200).json({
                success: true,
                layout
            })
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
    }
)