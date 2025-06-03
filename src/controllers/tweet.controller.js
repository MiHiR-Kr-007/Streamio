import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from  "../utils/ApiResponse.js";
import ApiError from  "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";

const publishTweet = asyncHandler( async(req,res)=> {
    const {content} = req.body;

    const ownerId = req.user._id;

    if(!content?.trim()){
        throw new ApiError(401,"Content cannot be empty")
    }

    const tweet = await Tweet.create({
        owner : ownerId,
        content
    });

    if(!tweet){
        throw new ApiError(500, "Error while creating tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet created successfully"
        )
    )
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
        sortType = "desc",
        userId
    } = req.query;

    if (!req.user) {
        throw new ApiError(401, "Unauthorized: Please login to view tweets");
    }

    const match = {
        ...(query ? { content: { $regex: query, $options: "i" } } : {}),
        ...(userId ? { owner: mongoose.Types.ObjectId(userId) } : {})
    };

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

        { $project: { ownerDetails: 0 } },

        {
            $sort: {
                [sortBy]: sortType === "desc" ? -1 : 1
            }
        },

        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    ]);

    if (!tweets) {
        throw new ApiError(404, "No tweets found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            tweets,
            "Tweets fetched successfully"
        )
    );
});

export {
    publishTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
}