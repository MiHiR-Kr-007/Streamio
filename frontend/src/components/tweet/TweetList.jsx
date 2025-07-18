import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { useSelector } from 'react-redux';
import defaultAvatar from '/images/default-avatar.svg';

const TweetList = () => {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated, user } = useSelector(state => state.auth);

    useEffect(() => {
        const fetchTweets = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(API_ENDPOINTS.TWEETS, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data?.data) {
                    setTweets(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching tweets:', err);
                setError(err.response?.data?.message || 'Failed to fetch tweets');
            } finally {
                setLoading(false);
            }
        };

        fetchTweets();
    }, []);

    const handleLikeTweet = async (tweetId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(API_ENDPOINTS.TOGGLE_TWEET_LIKE(tweetId), {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Update UI after like/unlike
            const updatedTweets = tweets.map(tweet => {
                if (tweet._id === tweetId) {
                    return {
                        ...tweet,
                        likes: tweet.isLiked ? tweet.likes - 1 : tweet.likes + 1,
                        isLiked: !tweet.isLiked
                    };
                }
                return tweet;
            });

            setTweets(updatedTweets);
        } catch (err) {
            console.error('Failed to toggle like:', err);
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
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Latest Tweets</h1>
                <div className="space-x-4">
                    {isAuthenticated && (
                        <>
                            <Link
                                to="/tweets/create"
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Create Tweet
                            </Link>
                            {/* Removed 'My Tweets' button */}
                        </>
                    )}
                </div>
            </div>

            {tweets.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tweets</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new tweet.</p>
                    {isAuthenticated && (
                        <div className="mt-6">
                            <Link
                                to="/tweets/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                                Create a tweet
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {tweets.map((tweet) => (
                        <div key={tweet._id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-start space-x-3">
                                <Link to={`/users/${tweet.owner?._id}`}>
                                    <img
                                        src={tweet.owner?.avatar || defaultAvatar}
                                        alt={tweet.owner?.username || 'User'}
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = defaultAvatar;
                                        }}
                                    />
                                </Link>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <Link to={`/users/${tweet.owner?._id}`} className="font-medium text-gray-900">
                                            {tweet.owner?.full_name || tweet.owner?.username || 'User'}
                                        </Link>
                                        <span className="text-sm text-gray-500">@{tweet.owner?.username || 'user'}</span>
                                        <span className="text-sm text-gray-500">
                                            • {new Date(tweet.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-gray-800">{tweet.content}</p>
                                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                                        <button
                                            onClick={() => handleLikeTweet(tweet._id)}
                                            className={`flex items-center space-x-1 ${tweet.isLiked ? 'text-red-600' : ''}`}
                                        >
                                            <svg className="w-5 h-5" fill={tweet.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            <span>{tweet.likes || 0}</span>
                                        </button>
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

export default TweetList; 