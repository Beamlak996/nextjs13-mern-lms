import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
    courseId: string
    userId: string
    payment_info: object   
}

const orderSchema = new Schema<IOrder>({
    courseId: {
        type: String,
        require: true
    },
    userId: {
        type: String,
        require: true
    }, 
    payment_info: {
        type: Object
    }
}, { timestamps: true })


export const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema) 