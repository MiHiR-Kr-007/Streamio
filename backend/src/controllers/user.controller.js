import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary, uploadAvatarOnCloudinary, uploadCoverImageOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(400,"Lode lagg gaye.")
        }
        
        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        // console.log(`refresh : ${refreshToken} : access : ${accessToken}`)
        return {
            accessToken,
            refreshToken
        }
    }
    catch{
        throw new ApiError(500, "Something Went Wrong while generating access and refresh token");
    }
};

const userRegister = asyncHandler ( async (req, res) => {

    const {username, full_name, email, password } = req.body;
    
    if([username, full_name, email, password].some((field) => !field || field.trim() === "" )){
        throw new ApiError(400,"All fields are required.");
    }
    
    const isUserExisted = await User.findOne({
        $or : [{username : username.toLowerCase()}, {email}]
    });
    
    if(isUserExisted){
        throw new ApiError(409, "The username or email already existed.");
    };
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    let avatar = null;
    let coverImage = null;
    
    try {
        avatar = await uploadAvatarOnCloudinary(avatarLocalPath);
        coverImage = await uploadCoverImageOnCloudinary(coverImageLocalPath);
        console.log(" Files uploaded to Cloudinary");
    } catch (error) {
        // console.log(" Cloudinary upload failed, using default avatar");
        // console.log("Error:", error.message);
        avatar = { url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" };
        coverImage = coverImageLocalPath ? { url: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg" } : null;
    }

    const user = await User.create({
        full_name,
        email,
        username : username.toLowerCase(),
        password,
        avatar : avatar?.url || "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        coverImage : coverImage?.url || ""
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"There is a problem while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User registered successfully"
        )
    );
    
})

const userLogin = asyncHandler ( async (req,res) => {
   
   const {email, password} = req.body;
   
   if(!email){
       throw new ApiError(400, "email is required");
    }
    
    const user = await User.findOne({
        $or : [{email}]
    });

    if(!user){
        throw new ApiError(404, "User does not exists");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid Password");
    }

    // console.log("User : ", user);
    
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    // console.log(`refresh : ${refreshToken} : access : ${accessToken}`)

    const loggedInUser = await User.findById(user._id).select(
        "-refreshToken -password"
    );

    const options = {
        httpOnly : true,
        secure : true
    }

    // console.log("access : ",accessToken);

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )
})

const userLogout = asyncHandler ( async (req, res) => {

    const user = req.user;
    await User.findByIdAndUpdate(
        user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "Logged Out Successfully"
        )
    )
})

const refreshAccessToken = asyncHandler( async(req,res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        
        if( !incomingRefreshToken ){
            throw new ApiError(401, "Unauthorised Request");
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id);
    
        if(!user){
            throw ApiError(401, "Invalid Refresh Token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {refreshToken,accessToken} = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid Refresh Token");
    }

})

const changePassword = asyncHandler ( async(req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if( !isPasswordCorrect ){
        throw new ApiError(400, "Invalid Old Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password Updated Successfully"
        )
    )
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(200,req.user,"Current user fetched successfully")
})

const updateAccountDetails = asyncHandler (async(req, res) => {
    //not giving permission to update email and username,
    const {full_name} = req.body;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                full_name
            }
        },
        {
            new : true
        }
    ).select("-password -refreshToken");

    if(!user){
        throw new ApiError(400,"Problem while changing name in db");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Full name updated successfully"
        )
    )

})

const updateUserAvatar = asyncHandler ( async(req,res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadAvatarOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    )

})

const updateUserCoverImage = asyncHandler ( async(req,res) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image file is missing");
    }

    const coverImage = await uploadCoverImageOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover image updated successfully"
        )
    )

})

const getChannelInfo = asyncHandler( async (req, res) => {
    const {username} = req.params;



    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }
    const userId = new mongoose.Types.ObjectId(req.user?._id);
    const channel = await User.aggregate([
        {
            $match : {
                username : username.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }    
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscribedTo" },
                isChannelSubscribed : {
                    $cond : {
                        if : { $in : [userId, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                full_name : 1,
                username : 1,
                subscribersCount : 1,
                channelSubscribedToCount : 1,
                isChannelSubscribed : 1,
                avatar : 1,
                coverImage : 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "user channel data fetched successfully"
        )
    )
})

const getWatchHistory = asyncHandler( async(req,res) => {
    const user = await User.aggregate([
        {
            $match :{ 
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        username : 1,
                                        full_name : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched."
        )
    )
})

const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    if(!userId) {
        throw new ApiError(400, "User ID is required");
    }

    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID format");
    }

    const currentUserId = req.user?._id;
    
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $lookup: {
                from: "playlists",
                localField: "_id",
                foreignField: "owner",
                as: "playlists"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscribedTo" },
                videoCount: { $size: "$videos" },
                playlistCount: { $size: "$playlists" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [currentUserId, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                full_name: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                videoCount: 1,
                playlistCount: 1,
                isSubscribed: 1,
                createdAt: 1
            }
        }
    ]);

    if (!user || user.length === 0) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0],
                "User fetched successfully"
            )
        );
});

export {
    userRegister,
    userLogin, 
    userLogout, 
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getChannelInfo,
    getWatchHistory,
    getUserById
}