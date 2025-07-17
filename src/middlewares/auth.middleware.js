import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        // Check if ACCESS_TOKEN_SECRET exists
        if (!process.env.ACCESS_TOKEN_SECRET) {
            console.error("ACCESS_TOKEN_SECRET environment variable is missing");
            throw new ApiError(500, "Server configuration error");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid token format");
        } else if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Token has expired");
        } else {
            throw new ApiError(401, error?.message || "Invalid access token");
        }
    }

});

export { verifyJWT };