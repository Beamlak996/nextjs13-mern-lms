import { app } from "./app"
import connectDB from "./utils/db"
require("dotenv").config()
import bcrypt from "bcryptjs"


app.listen(process.env.PORT, async ()=> {
    
    console.log(`Server is connected with port ${process.env.PORT}`)
    connectDB()
})