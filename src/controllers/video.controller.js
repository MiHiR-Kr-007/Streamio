import { Video } from "../models/video.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from  "../utils/ApiResponse.js";
import ApiError from  "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import uploadOnCloudinary from "../utils/cloudinary.js";
import getVideoDuration from "../utils/ffmpeg.js";

const getVideoById = asyncHandler( async(req, res) => {
    const videoId = req.params.videoId?.trim();
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId).populate("owner","name");

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    )
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

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
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
        const thumbnailLocalPath = req.file.thumbnail[0]?.path;
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if(!thumbnail){
            throw new ApiError(400, "Failed to upload thumbnail to Cloudinary")
        }

        updatedData.thumbnail = thumbnail.url;
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                updatedData
            }
        },
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
        { $bit: { isPublished: { xor: 1 } } },
        { new: true } 
    );

    if(!video){
        throw new ApiError(404,"Video not found");
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
        ...(userId ? { owner: mongoose.Types.ObjectId(userId) } : {}),
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

export {
    getVideoById,
    publishVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
}