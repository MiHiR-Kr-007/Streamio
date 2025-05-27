import cookieParser from "cookie-parser";
import cors from "cors";
import express from 'express';

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({"limit" : "16kb"}));
app.use(express.urlencoded({extended : true, limit : "16kb"}));
app.use(cookieParser());
app.use(express.static("public"));


// routes import
import userRouter from "./routes/user.router.js";

app.use("/api/v1/user", userRouter);

export {app}