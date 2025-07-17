import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from  "../utils/ApiResponse.js";
import ApiError from  "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { uploadOnCloudinary, uploadThumbnailOnCloudinary } from "../utils/cloudinary.js";
import getVideoDuration from "../utils/ffmpeg.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";

const getVideoById = asyncHandler(async(req, res) => {
    const videoId = req.params.videoId?.trim();
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    // Get the video with owner details
    const video = await Video.findById(videoId).populate("owner", "username avatar");

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    // Get like count for the video
    const likesCount = await Like.countDocuments({
        video: videoId
    });

    // Check if the current user has liked the video
    let isLiked = false;
    if (req.user?._id) {
        const userLike = await Like.findOne({
            video: videoId,
            likedBy: req.user._id
        });
        isLiked = !!userLike;
    }

    // Get subscriber count for the owner
    let subscriberCount = 0;
    if (video.owner && video.owner._id) {
        subscriberCount = await Subscription.countDocuments({ channel: video.owner._id });
    }

    // Create response object with video details, like info, and subscriber count
    const videoResponse = {
        ...video.toObject(),
        likes: likesCount,
        isLiked: isLiked,
        owner: {
            ...video.owner.toObject(),
            subscribers: subscriberCount
        }
    };

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videoResponse,
            "Video fetched successfully"
        )
    );
});

const publishVideo = asyncHandler( async(req, res) => {
    const {title, description} = req.body;

    if([title, description].some((element)=>element.trim()==="")){
        throw new ApiError(400, "All fields are required");
    }

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    const videoFileLocalPath = req.files?.videoFile[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    try{

        const duration = await getVideoDuration(videoFileLocalPath);

        const videoFile = await uploadOnCloudinary(videoFileLocalPath);
        if (!videoFile) {
            throw new ApiError(400, "Failed to upload video file to Cloudinary");
        }

        const thumbnail = await uploadThumbnailOnCloudinary(thumbnailLocalPath);
        if (!thumbnail) {
            throw new ApiError(400, "Failed to upload thumbnail to Cloudinary");
        }
    
    
        const videoDoc = await Video.create({
            title,
            description,
            thumbnail : thumbnail.url,
            videoFile : videoFile.url,
            duration,
            owner : req.user?._id
        });

        return res
        .status(201)
        .json(new ApiResponse(201, videoDoc, "Video published Successfully"));
    }
    catch(error){
        throw new ApiError(500, error?.message || "Something went wrong")
    }

});

const updateVideo = asyncHandler( async(req, res) => {
    
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    const videoId = req.params.videoId?.trim();
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const {title, description} = req.body;
    if([title, description].some((element)=>element.trim()==="")){
        throw new ApiError(400, "All fields are required");
    }

    const updatedData = {title, description};

    if(req.file){
        const thumbnailLocalPath = req.file?.path;
        const thumbnail = await uploadThumbnailOnCloudinary(thumbnailLocalPath);

        if(!thumbnail){
            throw new ApiError(400, "Failed to upload thumbnail to Cloudinary")
        }

        updatedData.thumbnail = thumbnail.url;
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        updatedData,
        {
            new : true,
            runValidators : true
        }
    )

    if(!video){
        throw new ApiError(404, "Error while updating database")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video details updated successfully"
        )
    )
});

const deleteVideo = asyncHandler( async(req, res) => {
    const videoId = req.params.videoId?.trim();
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndDelete(videoId);

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video deleted successfully"
        )
    )

});

const togglePublishStatus = asyncHandler( async(req, res) => {

    const videoId = req.params.videoId?.trim();

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        [
            {
                $set: {
                    isPublished: { $not: "$isPublished" }
                }
            }
        ],
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Video publish status toggled successfully")
    );

});

const getAllVideos = asyncHandler( async(req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType="desc", userId } = req.query;

    if( !req.user ){
        throw new ApiError(401,"You need to be logged in");
    }

    const match = {
        ...(query ? { title: { $regex: query, $options: "i" } } : {}), 
        ...(userId ? { owner: new mongoose.Types.ObjectId(userId) } : {}),
    };

    const videos = await Video.aggregate([
        {
            $match : match
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "videoOwner",
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
            $project : {
                videoFile : 1,
                thumbnail : 1,
                duration : 1,
                views : 1,
                title : 1,
                description : 1,
                isPublished : 1,
                owner : {
                    "$arrayElemAt" : ["$videoOwner",0]
                }
            }
        },
        {
            $sort : {
                [sortBy] : (sortType === "desc") ? -1 : 1 
            }
        },
        {
            $skip : (parseInt(page) - 1)*parseInt(limit)
        },
        {
            $limit : parseInt(limit)
        }
    ])

    if(!videos?.length){
        throw new ApiError(404, "No videos found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched succesfully"
        )
    )
});

const incrementVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    
    // Increment the view count
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );
    
    if (!updatedVideo) {
        return res.status(404).json({ success: false, message: 'Video not found' });
    }
    
    if (req.user?._id) {
        try {
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $pull: { watchHistory: videoId }
                }
            );
            
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $push: { 
                        watchHistory: {
                            $each: [videoId],
                            $position: 0
                        }
                    }
                }
            );
        } catch (error) {
            console.error("Error updating watch history:", error);
        }
    }
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { views: updatedVideo.views },
                "Video view count incremented successfully"
            )
        );
});

export {
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos,
    incrementVideoViews
}