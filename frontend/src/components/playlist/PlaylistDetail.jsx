import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import defaultThumbnail from '/images/default-thumbnail.svg';

// Duration formatting function
const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    const totalSeconds = Math.floor(Number(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const PlaylistDetail = () => {
    const { playlistId } = useParams();
    const { user } = useSelector((state) => state.auth);
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');

    useEffect(() => {
        const fetchPlaylist = async () => {
            if (!playlistId) {
                setError('Invalid playlist ID');
                setLoading(false);
                return;
            }

            try {
                console.log(`Fetching playlist with ID: ${playlistId}`);
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('Authentication required');
                    setLoading(false);
                    return;
                }

                console.log('Playlist API URL:', API_ENDPOINTS.PLAYLIST_DETAIL(playlistId));

                const response = await axios.get(API_ENDPOINTS.PLAYLIST_DETAIL(playlistId), {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    timeout: 10000 // 10 second timeout
                });

                if (response.data && response.data.data) {
                    console.log('Playlist data received:', response.data);
                    setPlaylist(response.data.data);
                    setEditedName(response.data.data.name);
                } else {
                    console.error('Invalid response format:', response.data);
                    setError('Failed to fetch playlist data: Invalid response format');
                }
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch playlist:', err);
                const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
                const statusCode = err.response?.status || 'No status';
                setError(`Failed to fetch playlist: ${errorMessage} (Status: ${statusCode})`);
                setLoading(false);
            }
        };

        fetchPlaylist();
    }, [playlistId]);

    const handleUpdateName = async (e) => {
        e.preventDefault();
        if (!editedName.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(API_ENDPOINTS.PLAYLIST_DETAIL(playlistId), {
                name: editedName,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                setPlaylist(response.data.data);
                setIsEditing(false);
            }
        } catch (err) {
            console.error('Failed to update playlist name:', err);
        }
    };

    const handleRemoveVideo = async (videoId) => {
        if (!window.confirm('Are you sure you want to remove this video from the playlist?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            console.log('Remove video API URL:', API_ENDPOINTS.REMOVE_VIDEO_FROM_PLAYLIST(videoId, playlistId));
            console.log('Video ID:', videoId, 'Playlist ID:', playlistId);

            const response = await axios.delete(API_ENDPOINTS.REMOVE_VIDEO_FROM_PLAYLIST(videoId, playlistId), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Remove video response:', response.data);

            setPlaylist((prev) => ({
                ...prev,
                videos: prev.videos.filter((video) => video._id !== videoId),
            }));
        } catch (err) {
            console.error('Failed to remove video from playlist:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            alert('Failed to remove video from playlist. See console for details.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 p-4">
                <p className="text-xl font-semibold mb-2">Error</p>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="text-center text-gray-600 p-4">
                <p>No playlist found</p>
                <Link to="/playlists" className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Back to Playlists
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Playlist Header */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex items-center justify-between">
                    {isEditing ? (
                        <form onSubmit={handleUpdateName} className="flex-1 flex space-x-4">
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={!editedName.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedName(playlist.name);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <>
                            <div>
                                <h1 className="text-2xl font-bold">{playlist.name}</h1>
                                <p className="mt-1 text-gray-500">
                                    {playlist.videos?.length || 0} videos
                                </p>
                            </div>
                            {user && user._id === playlist.owner?._id && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Videos List */}
            <div className="space-y-6">
                {playlist.videos && playlist.videos.length > 0 ? (
                    playlist.videos.map((video) => (
                        <div
                            key={video._id}
                            className="flex items-start space-x-4 bg-white rounded-lg shadow p-4"
                        >
                            <div className="flex-shrink-0 w-32">
                                <Link to={`/videos/${video._id}`}>
                                    <img
                                        src={video.thumbnail || defaultThumbnail}
                                        alt={video.title}
                                        className="w-full h-20 object-cover rounded-lg"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = defaultThumbnail;
                                        }}
                                    />
                                </Link>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Link
                                            to={`/videos/${video._id}`}
                                            className="text-lg font-medium text-gray-900 hover:text-red-600"
                                        >
                                            {video.title}
                                        </Link>
                                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                            <Link
                                                to={`/users/${video.owner?._id}`}
                                                className="hover:text-gray-900"
                                            >
                                                {video.owner?.full_name || video.owner?.username || 'Unknown user'}
                                            </Link>
                                            <span>{video.views || 0} views</span>
                                            <span>{formatDuration(video.duration)}</span>
                                        </div>
                                    </div>
                                    {user && user._id === playlist.owner?._id && (
                                        <button
                                            onClick={() => handleRemoveVideo(video._id)}
                                            className="text-gray-400 hover:text-red-600"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <p className="mt-2 text-sm text-gray-500 line-clamp-2 text-left">
                                    {video.description || 'No description'}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No videos in this playlist
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Add videos to your playlist to see them here
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/videos"
                                className="text-red-600 hover:text-red-700"
                            >
                                Back to Videos
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistDetail; 