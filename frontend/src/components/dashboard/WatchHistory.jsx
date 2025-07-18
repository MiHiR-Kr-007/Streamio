import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import defaultThumbnail from '/images/default-thumbnail.svg';

const WatchHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.WATCH_HISTORY, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                setHistory(response.data.data);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching watch history:', err);
            setError(err.response?.data?.message || 'Failed to fetch watch history');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleRemoveFromHistory = async (videoId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(API_ENDPOINTS.REMOVE_FROM_WATCH_HISTORY(videoId), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Update the UI by filtering out the removed video
            setHistory(prevHistory => prevHistory.filter(item => item.video._id !== videoId));
        } catch (err) {
            console.error('Error removing video from watch history:', err);
            alert('Failed to remove video from watch history');
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

    if (!history || history.length === 0) {
        return (
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No watch history</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Start watching videos to see them here
                </p>
                <div className="mt-6">
                    <Link
                        to="/videos"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                        Browse Videos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Watch History</h1>
            <div className="space-y-6">
                {history.map((item) => (
                    <div
                        key={item._id}
                        className="flex flex-col md:flex-row items-start md:space-x-4 bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                        <Link to={`/videos/${item.video._id}`} className="flex-shrink-0 w-full md:w-48 mb-4 md:mb-0">
                            <img
                                src={item.video.thumbnail || defaultThumbnail}
                                alt={item.video.title}
                                className="w-full md:w-48 h-auto md:h-27 object-cover rounded-lg"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = defaultThumbnail;
                                }}
                            />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                                <Link
                                    to={`/videos/${item.video._id}`}
                                    className="text-lg font-medium text-gray-900 hover:text-red-600"
                                >
                                    {item.video.title}
                                </Link>
                                <button
                                    onClick={() => handleRemoveFromHistory(item.video._id)}
                                    className="text-gray-400 hover:text-red-600"
                                    title="Remove from history"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                <Link
                                    to={`/users/${item.video.owner._id}`}
                                    className="hover:text-gray-900"
                                >
                                    {item.video.owner.username || item.video.owner.full_name}
                                </Link>
                                <span>{item.video.views} views</span>
                                <span>
                                    Watched {new Date(item.watchedAt).toLocaleString()}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                {item.video.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WatchHistory; 