import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import defaultThumbnail from '/images/default-thumbnail.svg';
import defaultAvatar from '/images/default-avatar.svg';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [videos, setVideos] = useState([]);
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tweetsLoading, setTweetsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: '/dashboard' } });
            return;
        }

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                // Fetch channel stats
                const statsResponse = await axios.get(API_ENDPOINTS.DASHBOARD + '/stats', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Fetch channel videos
                const videosResponse = await axios.get(API_ENDPOINTS.DASHBOARD + '/videos', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (statsResponse.data && statsResponse.data.data) {
                    setStats(statsResponse.data.data);
                }

                if (videosResponse.data && videosResponse.data.data) {
                    setVideos(videosResponse.data.data);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.response?.data?.message || 'Failed to fetch dashboard data');
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Fetch user tweets
        const fetchUserTweets = async () => {
            if (!user?._id) return;

            setTweetsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(API_ENDPOINTS.USER_TWEETS(user._id), {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data && response.data.data) {
                    setTweets(response.data.data);
                } else {
                    setTweets([]);
                }
                setTweetsLoading(false);
            } catch (err) {
                console.error('Error fetching user tweets:', err);
                setTweetsLoading(false);
            }
        };

        fetchUserTweets();
    }, [isAuthenticated, navigate, user]);

    if (!isAuthenticated) {
        return null; 
    }

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

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_ENDPOINTS.VIDEOS}/${videoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVideos((prev) => prev.filter((v) => v._id !== videoId));
            alert('Video deleted successfully.');
        } catch (err) {
            alert('Failed to delete video.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Channel Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-sm font-medium text-gray-500">Total Videos</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalVideos || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-sm font-medium text-gray-500">Total Views</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalViews?.toLocaleString() || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-sm font-medium text-gray-500">Total Likes</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalVideoLikes?.toLocaleString() || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-sm font-medium text-gray-500">Subscribers</h2>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalSubscribers?.toLocaleString() || 0}</p>
                </div>
            </div>

            {/* Recent Videos */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Your Videos</h2>
                    <Link
                        to="/videos/upload"
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Upload New Video
                    </Link>
                </div>

                {videos.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
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
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No videos yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating a new video
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/videos/upload"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                                Upload Your First Video
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video) => (
                            <div key={video._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200">
                                <Link to={`/videos/${video._id}`}>
                                    <img
                                        src={video.thumbnail || defaultThumbnail}
                                        alt={video.title}
                                        className="w-full h-40 object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = defaultThumbnail;
                                        }}
                                    />
                                </Link>
                                <div className="p-4">
                                    <Link
                                        to={`/videos/${video._id}`}
                                        className="text-lg font-medium text-gray-900 hover:text-red-600 line-clamp-2"
                                    >
                                        {video.title}
                                    </Link>
                                    <div className="mt-2 text-sm text-gray-500">
                                        <p>{video.views?.toLocaleString() || 0} views • {new Date(video.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="mt-4 flex space-x-2">
                                        <Link
                                            to={`/videos/edit/${video._id}`}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                                            onClick={() => handleDeleteVideo(video._id)}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                                            onClick={() => {
                                                // Placeholder for analytics
                                                alert('Analytics feature coming soon!');
                                            }}
                                        >
                                            Analytics
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Your Tweets Section */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Your Tweets</h2>
                    <Link
                        to="/tweets/create"
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Create New Tweet
                    </Link>
                </div>

                {tweetsLoading ? (
                    <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : tweets.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
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
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No tweets yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Share your thoughts with your subscribers
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/tweets/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                                Create Your First Tweet
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tweets.map((tweet) => (
                            <div key={tweet._id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-start space-x-3">
                                    <img
                                        src={tweet.owner?.avatar || defaultAvatar}
                                        alt={tweet.owner?.username || 'User'}
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = defaultAvatar;
                                        }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-900">{tweet.owner?.full_name || tweet.owner?.username || 'User'}</span>
                                            <span className="text-sm text-gray-500">@{tweet.owner?.username || 'user'}</span>
                                            <span className="text-sm text-gray-500">
                                                • {new Date(tweet.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-gray-800">{tweet.content}</p>
                                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                                <span>{tweet.likesCount || 0}</span>
                                            </div>
                                            <Link
                                                to={`/tweets/${tweet._id}`}
                                                className="text-gray-500 hover:text-red-600"
                                            >
                                                View Tweet
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="text-center mt-4">
                            <Link
                                to="/tweets/user"
                                className="text-red-600 hover:text-red-700 font-medium"
                            >
                                View All Your Tweets
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Watch History */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Watch History</h2>
                    <Link
                        to="/dashboard/watch-history"
                        className="text-red-600 hover:text-red-700"
                    >
                        View All
                    </Link>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <Link
                        to="/dashboard/watch-history"
                        className="text-center block w-full py-3 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100"
                    >
                        View Your Watch History
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 