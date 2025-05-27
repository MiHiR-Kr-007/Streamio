import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return
        {
            refreshToken,
            accessToken
        }
    }
    catch{
        throw new ApiError(500, "Something Went Wrong while generating access and refresh token");
    }
}

const userRegister = asyncHandler ( async (req, res) => {
    // get user details from frontend.
    // username, full_name, email, avatar, coverimage, password, refreshtoken.
    // validate it./ give error
    // cehck if there exists a account of it. give message.
    // check if avatar if present(mandatory).
    // upload it to cloudinary, if prob. give error
    // make a user object
    // save the info in db
    // we will get same type of response from db. 
    // password will be encrypted, remove/hide password, refresh token from response object
    // now if it is okay. send message

    const {username, full_name, email, password } = req.body;
    // console.log("Req body : ",req.body);

    if([username, full_name, email, password].some((field) => field.trim() === "" )){
        throw new ApiError(400,"All fields are required.");
    }

    const isUserExisted = await User.findOne({
        $or : [{username : username.toLowerCase()}, {email}]
    });

    if(isUserExisted){
        throw new ApiError(409, "The username or email already existed.");
    };
    console.log("Req Files : ",req.files);
    // console.log("Req files .avatar",req.files.avatar);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    // console.log("avatar local path : ",avatarLocalPath);

    

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage = await uploadOnCloudinary(coverImageLocalPath);

    const user = await User.create({
        full_name,
        email,
        username : username.toLowerCase(),
        password,
        avatar : avatar.url,
        coverImage : coverImage?.url || ""
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"There is a problem while registering the user")
    }

    // console.log("created user" , createdUser);

    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User registered successfully"
        )
    );

})

const userLogin = asyncHandler ( async (req,res) => {
    /*
        take email, password from req body
        validate it first, non empty
        check if {email, password} exists in db or not
        how to check for encrypted password
        create a refresh token for the user, add it to db
        give/return it to user also. 
    */

    const {username, email, password} = req.body;

    if(!username && !email){
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    });

    if(!user){
        throw new ApiError(404, "User does not exists");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid Password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-refreshToken -password"
    );

    const options = {
        httpOnly : true,
        secure : true
    }

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
    /*
        take the username, 
        get the corresponding refresh token and delete it.
        make its session time expire.
    */

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

    const user = User.findByIdAndUpdate(
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

    const avatar = await uploadOnCloudinary(avatarLocalPath);

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

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelSubscribedToCount : {
                    $size : "subscribedTo"
                },
                isChannelSubscribed : {
                    $cond : {
                        if : { $in : [req.user?._id, "$subscribers.subscriber"]},
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
                SubscribersCount : 1,
                ChannelSubscribedCount : 1,
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
                _id : mongoose.Types.ObjectId(req.user?._id) 
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
            user[0].getWatchHistory,
            "Watch history fetched."
        )
    )
})

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
    getWatchHistory
}