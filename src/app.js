import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import errorMiddleware from './middlewares/error.middleware.js'
import { checkTokenValidity } from './middlewares/auth.middleware.js'
import dotenv from 'dotenv'

import userRoutes from './routes/user.routes.js'
import taskRoutes from './routes/task.routes.js'

dotenv.config()

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//routes config
app.get("/api/v1/check", checkTokenValidity)
app.use("/api/v1/user", userRoutes)
app.use("/api/v1/task", taskRoutes)

app.all("*", (req, res) => {
    res.status(404).json({
        status: 404,
        success: false,
        message: "!Oops page not found"
    })
})

app.use(errorMiddleware)
export default app