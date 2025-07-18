import mongoose, {isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const subscriberId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    
    if (subscriberId.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    }

    await Subscription.create({ subscriber: subscriberId, channel: channelId });
    return res
        .status(201)
        .json(new ApiResponse(201, {}, "Subscribed successfully"));
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    let totalSubscibedChannel;
    try {
        totalSubscibedChannel = await Subscription.countDocuments({
            channel: channelId,
        });
    } catch (error) {
        throw new ApiError(500, "Database error while counting subscribers");
    }

    return res.status(200).json(
        new ApiResponse(200, totalSubscibedChannel , "Channel subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async(req, res)=> {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    let totalSubscibedChannel;
    try {
        totalSubscibedChannel = await Subscription.countDocuments({
            subscribers : channelId,
        });
    } catch (error) {
        throw new ApiError(500, "Database error while total subscribed channels");
    }

    return res.status(200).json(
        new ApiResponse(200, totalSubscibedChannel , "Total channel subscribed fetched successfully")
    );
});

export {
    toggleSubscription,
    getChannelSubscribers,
    getSubscribedChannels
}