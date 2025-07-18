import mongoose, {isValidObjectId} from "mongoose";
import {Playlist} from "../models/playlist.model.js";
import  ApiError  from "../utils/ApiError.js";
import  ApiResponse  from "../utils/ApiResponse.js";
import  asyncHandler  from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async(req, res) => {
    const {name, description} = req.body;
    if(!name || !description){
        throw new ApiError(400, "Name and description are required");
    }

    const existingPlaylist = await Playlist.findOne({
        name,
        owner: req.user._id
    });

    if(existingPlaylist){
        throw new ApiError(400, "You already have a playlist with this name");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner : req.user._id,
    });

    if(!playlist){
        throw new ApiError(500, "Something went wrong while creating playlist");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"))
});

const getUserPlaylists = asyncHandler(async(req, res) => {
    const {userId} = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id");
    }

    const playlists = await Playlist.find({
        owner : userId,
    });

    if(!playlists || playlists.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "No playlists found for this user."));
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async(req, res) => {
    const {playlistId}  = req.params;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id");
    }

    try {
        const playlist = await Playlist.findById(playlistId).populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "username full_name avatar"
            }
        });

        if(!playlist){
            throw new ApiError(404, "Playlist not found");
        }

        return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
    } catch (error) {
        console.error("Error fetching playlist:", error);
        throw new ApiError(500, `Error fetching playlist: ${error.message}`);
    }
});

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid playlist or video id");
    }

    try {
        // Check if the playlist exists and belongs to the current user
        const playlist = await Playlist.findOne({
            _id: playlistId,
            owner: req.user._id
        });

        if (!playlist) {
            throw new ApiError(404, "Playlist not found or you don't have permission");
        }

        // Check if the video is already in the playlist
        if (playlist.videos.some(vid => vid.toString() === videoId)) {
            return res
                .status(200)
                .json(new ApiResponse(200, playlist, "Video already in playlist"));
        }

        // Add the video to the playlist
        playlist.videos.push(videoId);
        
        if (!playlist.description) {
            playlist.description = playlist.name || "No description";
        }
        
        await playlist.save();

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
    } catch (error) {
        console.error("Error adding video to playlist:", error);
        throw new ApiError(500, `Error adding video to playlist: ${error.message}`);
    }
});

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    try {
        const playlist = await Playlist.findOne({
            _id: playlistId,
            owner: req.user._id
        });

        if (!playlist) {
            throw new ApiError(404, "Playlist not found or you don't have permission");
        }

        // Check if the video is in the playlist
        if (!playlist.videos.some(vid => vid.toString() === videoId)) {
            return res
                .status(200)
                .json(new ApiResponse(200, playlist, "Video not in playlist"));
        }

        // Remove the video from the playlist
        playlist.videos = playlist.videos.filter(
            video => video.toString() !== videoId.toString()
        );
        
        if (!playlist.description) {
            playlist.description = playlist.name || "No description";
        }
        
        await playlist.save();

        return res
            .status(200)
            .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));
    } catch (error) {
        console.error("Error removing video from playlist:", error);
        throw new ApiError(500, `Error removing video from playlist: ${error.message}`);
    }
});

const deletePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const deletedPlaylistDoc = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylistDoc) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedPlaylistDoc, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!name || !description) {
        throw new ApiError(400, "Name or description cannot be empty");
    }

    const updatedPlaylistDoc = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedPlaylistDoc) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylistDoc, "Playlist updated successfully")
    );
  
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};