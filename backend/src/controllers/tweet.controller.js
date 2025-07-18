import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from  "../utils/ApiResponse.js";
import ApiError from  "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Like } from "../models/like.model.js";

const createTweet = asyncHandler(async(req, res) => {
    const { content } = req.body;
    const ownerId = req.user?._id;

    if (!ownerId) {
        throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content cannot be empty");
    }

    try {
        const tweet = await Tweet.create({
            owner: ownerId,
            content: content.trim()
        });

        if (!tweet) {
            throw new ApiError(500, "Error while creating tweet");
        }

        // Fetch the created tweet with owner details
        const tweetWithOwner = await Tweet.findById(tweet._id).populate("owner", "username avatar");

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    tweetWithOwner,
                    "Tweet created successfully"
                )
            );
    } catch (error) {
        console.error("Error creating tweet:", error);
        throw new ApiError(500, "Error while creating tweet: " + error?.message);
    }
});

const updateTweet = asyncHandler (async(req, res)=>{
    const {content} = req.body;
    const {tweetId} = req.params;
    const userId = req.user._id;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id");
    }

    if(!content?.trim()){
        throw new ApiError(401,"Content cannot be empty");
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id : tweetId,
            owner : userId
        },
        {
            $set : { content }
        },
        { new : true }
    )
    
    if(!updatedTweet){
        throw new ApiError(500, "Tweet not found or You are not allowed to update this")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    )

});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: userId
    });

    if (!deletedTweet) {
        throw new ApiError(403, "Tweet not found or you're not authorized to delete it");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            deletedTweet,
            "Tweet deleted successfully"
        )
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc"
    } = req.query;
    const { userId } = req.params;

    if (!req.user) {
        throw new ApiError(401, "Unauthorized: Please login to view tweets");
    }

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid or missing userId");
    }

    try {
        const match = {
            ...(query ? { content: { $regex: query, $options: "i" } } : {}),
            owner: new mongoose.Types.ObjectId(userId)
        };

        // First get all tweets with owner details
        const tweets = await Tweet.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                full_name: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$ownerDetails", 0] }
                }
            },
            {
                $project: {
                    ownerDetails: 0
                }
            },
            {
                $sort: {
                    [sortBy]: sortType === "desc" ? -1 : 1
                }
            },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
        ]);

        if (!tweets || tweets.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No tweets found for this user"));
        }

        const tweetsWithLikes = await Promise.all(
            tweets.map(async (tweet) => {
                const likesCount = await Like.countDocuments({
                    tweet: tweet._id
                });

                const userLike = await Like.findOne({
                    tweet: tweet._id,
                    likedBy: req.user._id
                });

                return {
                    ...tweet,
                    likes: likesCount,
                    isLiked: !!userLike
                };
            })
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                tweetsWithLikes,
                "Tweets fetched successfully"
            )
        );
    } catch (error) {
        console.error("Error fetching user tweets:", error);
        throw new ApiError(500, "Error fetching user tweets: " + error?.message);
    }
});

const getAllTweets = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortType = "desc"
    } = req.query;

    if (!req.user) {
        throw new ApiError(401, "Unauthorized: Please login to view tweets");
    }

    try {
        const tweets = await Tweet.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                full_name: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$ownerDetails", 0] }
                }
            },
            {
                $project: {
                    ownerDetails: 0
                }
            },
            {
                $sort: {
                    [sortBy]: sortType === "desc" ? -1 : 1
                }
            },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
        ]);

        const tweetsWithLikes = await Promise.all(
            tweets.map(async (tweet) => {
                // Count total likes for this tweet
                const likesCount = await Like.countDocuments({
                    tweet: tweet._id
                });

                const userLike = await Like.findOne({
                    tweet: tweet._id,
                    likedBy: req.user._id
                });

                return {
                    ...tweet,
                    likes: likesCount,
                    isLiked: !!userLike
                };
            })
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                tweetsWithLikes,
                "Tweets fetched successfully"
            )
        );
    } catch (error) {
        console.error("Error fetching tweets:", error);
        throw new ApiError(500, "Error fetching tweets: " + error?.message);
    }
});

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets,
    getAllTweets
}