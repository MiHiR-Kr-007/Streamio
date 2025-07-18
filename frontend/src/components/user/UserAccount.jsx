import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import defaultAvatar from '/images/default-avatar.svg';
import defaultThumbnail from '/images/default-thumbnail.svg';
import PlaylistList from '../playlist/PlaylistList';

const UserAccount = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalLikes: 0,
        totalViews: 0,
        totalVideos: 0,
        totalSubscribers: 0,
        totalSubscriptions: 0
    });
    const [watchHistory, setWatchHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState({
        statsStarted: false,
        statsCompleted: false,
        historyStarted: false,
        historyCompleted: false,
        errors: []
    });

    // Redirect to login if not authenticated
    useEffect(() => {
        console.log('UserAccount: Auth state check', { isAuthenticated, currentUser });
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: '/users/account' } });
        }
    }, [isAuthenticated, navigate]);

    // Fetch user stats
    useEffect(() => {
        const fetchStats = async () => {
            if (!currentUser?._id) {
                console.log('UserAccount: No user ID, skipping stats fetch');
                return;
            }

            console.log('UserAccount: Starting stats fetch');
            setLoading(true);
            setDebugInfo(prev => ({ ...prev, statsStarted: true }));

            try {
                const token = localStorage.getItem('token');
                console.log('UserAccount: Token available:', !!token);

                // Create an AbortController to handle timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.log('UserAccount: Stats request timed out');
                    controller.abort();
                }, 10000); // 10 second timeout

                console.log('UserAccount: Making stats API call to:', API_ENDPOINTS.DASHBOARD + '/stats');
                const response = await axios.get(API_ENDPOINTS.DASHBOARD + '/stats', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log('UserAccount: Stats API call succeeded', response.data);

                if (response.data && response.data.data) {
                    setStats({
                        totalLikes: response.data.data.totalLikes || 0,
                        totalViews: response.data.data.totalViews || 0,
                        totalVideos: response.data.data.totalVideos || 0,
                        totalSubscribers: response.data.data.totalSubscribers || 0,
                        totalSubscriptions: currentUser.channelSubscribedToCount || 0
                    });
                }
                setDebugInfo(prev => ({ ...prev, statsCompleted: true }));
                setLoading(false);
            } catch (error) {
                console.error('UserAccount: Failed to fetch channel stats:', error);
                setDebugInfo(prev => ({
                    ...prev,
                    errors: [...prev.errors, {
                        type: 'stats',
                        message: error.message,
                        name: error.name,
                        code: error.code,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        responseData: error.response?.data
                    }]
                }));

                if (error.name === 'AbortError') {
                    setError('Request timed out. Please try again later.');
                } else {
                    setError('Failed to load account data: ' + (error.response?.data?.message || error.message));
                }
                setLoading(false);
            }
        };

        fetchStats();
    }, [currentUser]);

    // Fetch watch history
    useEffect(() => {
        const fetchWatchHistory = async () => {
            if (!currentUser?._id) {
                console.log('UserAccount: No user ID, skipping history fetch');
                return;
            }

            console.log('UserAccount: Starting watch history fetch');
            setHistoryLoading(true);
            setDebugInfo(prev => ({ ...prev, historyStarted: true }));

            try {
                const token = localStorage.getItem('token');
                console.log('UserAccount: Token available for history:', !!token);

                // Create an AbortController to handle timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.log('UserAccount: History request timed out');
                    controller.abort();
                }, 10000); // 10 second timeout

                console.log('UserAccount: Making history API call to:', API_ENDPOINTS.WATCH_HISTORY);
                const response = await axios.get(API_ENDPOINTS.WATCH_HISTORY, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log('UserAccount: History API call succeeded');

                if (response.data && response.data.data) {
                    setWatchHistory(response.data.data.slice(0, 5)); // Show only 5 most recent
                }
                setDebugInfo(prev => ({ ...prev, historyCompleted: true }));
            } catch (error) {
                console.error('UserAccount: Failed to fetch watch history:', error);
                setDebugInfo(prev => ({
                    ...prev,
                    errors: [...prev.errors, {
                        type: 'history',
                        message: error.message,
                        name: error.name,
                        code: error.code,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        responseData: error.response?.data
                    }]
                }));
                // We don't set the main error state for watch history issues
                // as it's not critical to the page functioning
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchWatchHistory();
    }, [currentUser]);

    if (!isAuthenticated || !currentUser) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
                <div className="text-sm text-gray-600">
                    <p>Loading user account data...</p>
                    <p className="mt-2">Debug info:</p>
                    <ul className="list-disc pl-5 mt-1">
                        <li>Stats request started: {debugInfo.statsStarted ? 'Yes' : 'No'}</li>
                        <li>Stats request completed: {debugInfo.statsCompleted ? 'Yes' : 'No'}</li>
                        <li>History request started: {debugInfo.historyStarted ? 'Yes' : 'No'}</li>
                        <li>History request completed: {debugInfo.historyCompleted ? 'Yes' : 'No'}</li>
                        <li>Errors: {debugInfo.errors.length}</li>
                    </ul>
                    {debugInfo.errors.length > 0 && (
                        <div className="mt-2 text-red-500">
                            <p>Last error: {debugInfo.errors[debugInfo.errors.length - 1].message}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 p-4">
                <p className="text-xl font-semibold mb-2">Error</p>
                <p>{error}</p>
                <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm text-gray-700">
                    <p className="font-semibold">Debug Information:</p>
                    <ul className="list-disc pl-5 mt-1">
                        <li>Stats request started: {debugInfo.statsStarted ? 'Yes' : 'No'}</li>
                        <li>Stats request completed: {debugInfo.statsCompleted ? 'Yes' : 'No'}</li>
                        <li>History request started: {debugInfo.historyStarted ? 'Yes' : 'No'}</li>
                        <li>History request completed: {debugInfo.historyCompleted ? 'Yes' : 'No'}</li>
                    </ul>
                    {debugInfo.errors.length > 0 && (
                        <div className="mt-2">
                            <p className="font-semibold">Error details:</p>
                            <pre className="bg-gray-200 p-2 rounded mt-1 overflow-auto max-h-40">
                                {JSON.stringify(debugInfo.errors, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Account Header */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                {/* Cover Image + Avatar Overlay */}
                <div className="relative h-40 bg-gray-200">
                    {currentUser.coverImage && (
                        <img
                            src={currentUser.coverImage}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                            }}
                        />
                    )}
                    {/* Avatar absolutely positioned over cover image */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-1/2 z-20">
                        <img
                            className="h-24 w-24 rounded-full border-4 border-white shadow-lg bg-white object-cover"
                            src={currentUser.avatar || defaultAvatar}
                            alt={currentUser.full_name || currentUser.username}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultAvatar;
                            }}
                        />
                    </div>
                </div>
                {/* Profile Info */}
                <div className="px-4 py-5 sm:p-6 pt-16">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                        {/* Remove avatar from here, now over cover image */}
                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {currentUser.full_name || currentUser.username}
                            </h1>
                            <p className="text-gray-500">@{currentUser.username}</p>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-500">
                                Subscribers
                            </h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {stats.totalSubscribers}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-500">
                                Subscriptions
                            </h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {stats.totalSubscriptions}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-500">
                                Videos
                            </h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {stats.totalVideos}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-500">
                                Views
                            </h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {stats.totalViews}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-500">
                                Likes
                            </h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {stats.totalLikes}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Playlists Section */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Your Playlists</h2>
                    </div>

                    {currentUser && currentUser._id && (
                        <PlaylistList userId={currentUser._id} />
                    )}
                </div>
            </div>

            {/* Watch History Section */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Watch History</h2>
                        <Link
                            to="/dashboard/watch-history"
                            className="text-red-600 hover:text-red-700"
                        >
                            View All
                        </Link>
                    </div>

                    {historyLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                        </div>
                    ) : watchHistory && watchHistory.length > 0 ? (
                        <div className="space-y-4">
                            {watchHistory.map((item) => (
                                <Link
                                    key={item._id}
                                    to={`/videos/${item.video._id}`}
                                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex-shrink-0">
                                        <img
                                            src={item.video.thumbnail || defaultThumbnail}
                                            alt={item.video.title}
                                            className="w-32 h-20 object-cover rounded"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = defaultThumbnail;
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 line-clamp-2">
                                            {item.video.title}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Watched {new Date(item.watchedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserAccount; 