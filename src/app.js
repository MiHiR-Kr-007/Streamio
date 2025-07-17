import cookieParser from "cookie-parser";
import cors from "cors";
import express from 'express';
import ApiError from "./utils/ApiError.js";

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
console.log("CORS Origin configured as:", corsOrigin);

// CORS middleware with debug logging
// app.use((req, res, next) => {
//     console.log(`Incoming request: ${req.method} ${req.url}`);
//     console.log(`Origin: ${req.headers.origin}`);
//     next();
// });

app.use(cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));

console.log("CORS middleware configured");

app.use(express.json({"limit" : "16kb"}));
app.use(express.urlencoded({extended : true, limit : "16kb"}));
app.use(cookieParser());
app.use(express.static("public"));


// routes import
import userRouter from "./routes/user.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

// Error handling middleware
// app.use((err, req, res, next) => {
//     console.error('=== Error Handling Middleware ===');
//     console.error('Error type:', err.constructor.name);
//     console.error('Error message:', err.message);
//     console.error('Error stack:', err.stack);
//     console.error('Request method:', req.method);
//     console.error('Request URL:', req.url);
//     console.error('Request headers:', req.headers);
//     console.error('Request body:', req.body);
//     console.error('Request files:', req.files);
    
//     if (err instanceof ApiError) {
//         console.error('ApiError detected, status:', err.statusCode);
//         return res.status(err.statusCode).json({
//             success: false,
//             message: err.message,
//             errors: err.errors,
//             statusCode: err.statusCode
//         });
//     }
    
//     // Handle multer errors
//     if (err.code === 'LIMIT_FILE_SIZE') {
//         console.error('Multer file size error');
//         return res.status(400).json({
//             success: false,
//             message: 'File too large',
//             statusCode: 400
//         });
//     }
    
//     if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//         console.error('Multer unexpected file error');
//         return res.status(400).json({
//             success: false,
//             message: 'Unexpected file field',
//             statusCode: 400
//         });
//     }
    
//     // Default error
//     console.error('Default error handler');
//     return res.status(500).json({
//         success: false,
//         message: 'Internal server error',
//         statusCode: 500
//     });
// });

export {app}