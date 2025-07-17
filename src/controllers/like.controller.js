import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { isValidObjectId } from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID");
        }

        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(401, "Unauthorized: User not found");
        }

        const existingLike = await Like.findOne({
            video: videoId,
            likedBy: userId,
        });

        if (!existingLike) {
            await Like.create({
                video: videoId,
                likedBy: userId,
            });

            return res
            .status(201)
            .json(new ApiResponse(201, existingLike, "Video liked successfully"));
        }

        const unLikeVideo = await Like.findByIdAndDelete(existingLike._id);

        if (!unLikeVideo) {
            throw new ApiError(500, "Failed to unlike video");
        }

        return res
        .status(200)
        .json(new ApiResponse(200, existingLike, "Video unliked successfully"));

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while toggling like");
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;

    const userId = req.user._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        return res
        .status(200)
        .json(new ApiResponse(200, existingLike, "Tweet unliked successfully"));
    }

    const likeTweet = await Like.create({
        tweet: tweetId,
        likedBy: userId,
    });

    return res
    .status(201)
    .json(new ApiResponse(201, likeTweet, "Tweet liked successfully"));

});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const userId = req.user._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        return res
        .status(200)
        .json(new ApiResponse(200, existingLike, "Comment unliked successfully"));
    }

    const likeComment = await Like.create({
        comment: commentId, 
        likedBy: userId,
    });

    return res
    .status(201)
    .json(new ApiResponse(201, likeComment, "Comment liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: User not found");
    }

    const likedVideos = await Like.find({
        likedBy: userId,
        video: { $exists: true },
    }).populate("video", "_id title url");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos || [],
            likedVideos.length === 0
                ? "No liked videos found"
                : "Liked videos fetched successfully"
        )
    );
});

const getLikeStatus = asyncHandler(async (req, res) => {
    const { contentType, contentId } = req.params;
    
    if (!isValidObjectId(contentId)) {
        throw new ApiError(400, `Invalid ${contentType} ID`);
    }

    if (!req.user?._id) {
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false, likeCount: 0 }, "Like status fetched (user not logged in)")
        );
    }

    const query = { likedBy: req.user._id };
    if (contentType === 'v') {
        query.video = contentId;
    } else if (contentType === 'c') {
        query.comment = contentId;
    } else if (contentType === 't') {
        query.tweet = contentId;
    } else {
        throw new ApiError(400, "Invalid content type");
    }

    const existingLike = await Like.findOne(query);
    
    const likeCount = await Like.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                isLiked: !!existingLike,
                likeCount
            }, 
            "Like status fetched successfully"
        )
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikeStatus
}