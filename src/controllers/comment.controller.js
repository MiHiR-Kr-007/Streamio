import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const videoObjectId = mongoose.Types.ObjectId(videoId);

    const comments = await Comment.aggregate([
        {
            $match: {
                video: videoObjectId,
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "CommentOnWhichVideo",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "OwnerOfComment",
            },
        },
        {
            $project: {
                content: 1, 
                owner: {
                    $arrayElemAt: ["$OwnerOfComment", 0], 
                },
                video: {
                    $arrayElemAt: ["$CommentOnWhichVideo", 0], 
                },
                createdAt: 1,
            },
        },
        {
            $skip: (page - 1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
    ]);
    console.log(comments);

    if (!comments?.length) {
        throw new ApiError(404, "Comments are not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));

});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!req.user) {
        throw new ApiError(401, "User must be logged in");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    let addedComment;
    try {
        addedComment = await Comment.create({
            content: content.trim(),
            owner: req.user._id,
            video: videoId,
        });
    } catch (error) {
        throw new ApiError(500, "Database error while adding the comment");
    }

    if (!addedComment) {
        throw new ApiError(500, "Failed to add comment");
    }

    return res.status(200).json(
        new ApiResponse(200, addedComment, "Comment added successfully")
    );
});


const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!req.user) {
        throw new ApiError(401, "User must be logged in");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment cannot be empty");
    }

    let updatedComment;
    try {
        updatedComment = await Comment.findOneAndUpdate(
            {
                _id: commentId,
                owner: req.user._id,
            },
            {
                $set: { content },
            },
            { new: true }
        );
    } catch (error) {
        throw new ApiError(500, "Database error while updating the comment");
    }

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found or not authorized to update");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment successfully updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!req.user) {
        throw new ApiError(401, "User must be logged in");
    }

    let deletedCommentDoc;
    try {
        deletedCommentDoc = await Comment.findOneAndDelete({
            _id: commentId,
            owner: req.user._id,
        });
    } catch (error) {
        throw new ApiError(500, "Database error while deleting the comment");
    }

    if (!deletedCommentDoc) {
        throw new ApiError(404, "Comment not found or not authorized to delete");
    }

    return res.status(200).json(
        new ApiResponse(200, deletedCommentDoc, "Comment deleted successfully")
    );
});


export { 
    getVideoComments,
    addComment, 
    updateComment, 
    deleteComment 
};  