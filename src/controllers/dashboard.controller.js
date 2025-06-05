import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    const totalVideos = await Video.countDocuments({ owner: userId });
    if (totalVideos === undefined || totalVideos === null) {
        throw new ApiError(500, "Failed to fetch total video count");
    }

    const viewsAggregation = await Video.aggregate([
        { $match: { owner: userId } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
            },
        },
    ]);
    const totalViews = viewsAggregation?.[0]?.totalViews || 0;

    if (totalViews === undefined || totalViews === null) {
        throw new ApiError(500, "Failed to fetch total views");
    }

    const userVideoIds = await Video.find({ owner: userId }).distinct("_id");
    if (!Array.isArray(userVideoIds)) {
        throw new ApiError(500, "Failed to fetch video IDs for likes calculation");
    }

    const totalVideoLikes = await Like.countDocuments({ video: { $in: userVideoIds } });
    if (totalVideoLikes === undefined || totalVideoLikes === null) {
        throw new ApiError(500, "Failed to fetch total video likes");
    }

    const totalSubscribers = await Subscription.countDocuments({ channel: userId });
    if (totalSubscribers === undefined || totalSubscribers === null) {
        throw new ApiError(500, "Failed to fetch total subscribers");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalVideoLikes,
                totalSubscribers,
                totalViews,
            },
            "Channel stats fetched successfully"
        )
    );
});


const getChannelVideos = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const videos = await Video.find({
        owner: userId,
    }).sort({
        createdAt: -1, 
    });

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats, 
    getChannelVideos
}