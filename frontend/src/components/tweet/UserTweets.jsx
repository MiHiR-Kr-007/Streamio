import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import defaultAvatar from '/images/default-avatar.svg';

const UserTweets = () => {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: '/tweets/user' } });
            return;
        }

        const fetchUserTweets = async () => {
            if (!user?._id) return;

            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                // Log the API endpoint being used
                console.log('User tweets API URL:', API_ENDPOINTS.USER_TWEETS(user._id));

                // Use correct URL format for the API endpoint - notice we're using the USER_TWEETS endpoint
                const response = await axios.get(API_ENDPOINTS.USER_TWEETS(user._id), {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                console.log('User tweets response:', response.data);

                if (response.data && response.data.data) {
                    setTweets(response.data.data);
                } else {
                    setTweets([]);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching user tweets:', err);
                setError(err.response?.data?.message || 'Failed to fetch your tweets');
                setLoading(false);
            }
        };

        fetchUserTweets();
    }, [isAuthenticated, navigate, user]);

    const handleDeleteTweet = async (tweetId) => {
        if (!window.confirm('Are you sure you want to delete this tweet?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_ENDPOINTS.TWEETS}/${tweetId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Update UI by removing deleted tweet
            setTweets(tweets.filter(tweet => tweet._id !== tweetId));
        } catch (err) {
            console.error('Failed to delete tweet:', err);
            alert(err.response?.data?.message || 'Failed to delete tweet');
        }
    };

    if (!isAuthenticated) {
        return null; // Don't render anything while redirecting
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

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Your Tweets</h1>
                <Link
                    to="/tweets/create"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                    Create New Tweet
                </Link>
            </div>

            {tweets.length === 0 ? (
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
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium text-gray-900">{tweet.owner?.full_name || tweet.owner?.username || 'User'}</span>
                                            <span className="text-sm text-gray-500">@{tweet.owner?.username || 'user'}</span>
                                            <span className="text-sm text-gray-500">
                                                • {new Date(tweet.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleDeleteTweet(tweet._id)}
                                                className="text-gray-400 hover:text-red-600"
                                                title="Delete tweet"
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
                                        </div>
                                    </div>
                                    <p className="mt-1 text-gray-800">{tweet.content}</p>
                                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            <span>{tweet.likes || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserTweets; 