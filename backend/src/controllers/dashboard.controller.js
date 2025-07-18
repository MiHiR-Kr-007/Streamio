import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"

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

    // Get user's video IDs
    const userVideoIds = await Video.find({ owner: userId }).distinct("_id");

    // Get total likes on user's videos
    let totalVideoLikes = 0;
    if (userVideoIds.length > 0) {
        const likesCount = await Like.countDocuments({
            video: { $in: userVideoIds }
        });
        totalVideoLikes = likesCount || 0;
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
        return res.status(200).json(new ApiResponse(200, [], "No videos found for this channel"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    try {
        const user = await User.findById(userId)
            .select("watchHistory")
            .populate({
                path: "watchHistory",
                model: "Video",
                select: "title description thumbnail views duration createdAt owner",
                populate: {
                    path: "owner",
                    model: "User",
                    select: "username full_name avatar"
                }
            });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const formattedWatchHistory = user.watchHistory.map((video, index) => {
       
            const watchedAt = new Date(Date.now() - index * 3600000); 

            return {
                _id: `wh_${video._id}_${index}`, 
                video: video,
                watchedAt: watchedAt
            };
        });
        
        return res.status(200).json(
            new ApiResponse(
                200,
                formattedWatchHistory,
                "Watch history fetched successfully"
            )
        );
    } catch (error) {
        console.error("Error fetching watch history:", error);
        throw new ApiError(500, "Failed to fetch watch history");
    }
});

const removeFromWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { videoId } = req.params;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    try {
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (!user.watchHistory.includes(videoId)) {
            throw new ApiError(404, "Video not found in watch history");
        }

        // Remove the video from watch history
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $pull: { watchHistory: videoId }
            },
            { new: true }
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                { success: true },
                "Video removed from watch history successfully"
            )
        );
    } catch (error) {
        console.error("Error removing video from watch history:", error);
        throw new ApiError(500, "Failed to remove video from watch history");
    }
});

export {
    getChannelStats, 
    getChannelVideos,
    getWatchHistory,
    removeFromWatchHistory
}