import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
    fetchUserProfile,
    subscribeToUser,
    unsubscribeFromUser
} from '../../redux/slices/userSlice';
import { API_ENDPOINTS } from '../../config/api';
import defaultAvatar from '/images/default-avatar.svg';
import defaultThumbnail from '/images/default-thumbnail.svg';

const UserProfile = () => {
    const { userId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { profile, loading, error } = useSelector((state) => state.user);
    const { user: currentUser, isAuthenticated } = useSelector((state) => state.auth);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState({
        isSubscribed: false,
        subscriberCount: 0
    });
    const [userVideos, setUserVideos] = useState([]);
    const [videosLoading, setVideosLoading] = useState(true);
    const [videosError, setVideosError] = useState(null);

    const isOwnProfile = currentUser?._id === (profile?._id || userId);

    useEffect(() => {
        if (userId) {
            dispatch(fetchUserProfile(userId));
        } else if (currentUser) {
            // If no userId provided but user is logged in, show current user profile
            navigate(`/users/${currentUser._id}`);
        }
    }, [dispatch, userId, currentUser, navigate]);

    useEffect(() => {
        if (profile) {
            setSubscriptionStatus({
                isSubscribed: profile.isSubscribed || false,
                subscriberCount: profile.subscriberCount || 0
            });

            // Fetch user videos when profile is loaded
            fetchUserVideos();
        }
    }, [profile]);

    const fetchUserVideos = async () => {
        if (!userId) return;

        setVideosLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_ENDPOINTS.VIDEOS}?userId=${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data && response.data.data) {
                setUserVideos(response.data.data);
            } else {
                setUserVideos([]);
            }
            setVideosLoading(false);
        } catch (err) {
            console.error('Error fetching user videos:', err);
            setVideosError(err.response?.data?.message || 'Failed to fetch videos');
            setVideosLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: `/users/${userId}` } });
            return;
        }

        // Prevent multiple clicks
        if (isSubscribing) return;

        setIsSubscribing(true);

        try {
            // Optimistically update UI
            const newStatus = !subscriptionStatus.isSubscribed;
            const newCount = subscriptionStatus.subscriberCount + (newStatus ? 1 : -1);

            setSubscriptionStatus({
                isSubscribed: newStatus,
                subscriberCount: newCount
            });

            // Make API call
            if (newStatus) {
                await dispatch(subscribeToUser(userId)).unwrap();
            } else {
                await dispatch(unsubscribeFromUser(userId)).unwrap();
            }

            // No need to refresh profile data as we've already updated the UI
        } catch (error) {
            console.error('Subscription action failed:', error);
            // Revert UI on error
            setSubscriptionStatus({
                isSubscribed: profile.isSubscribed || false,
                subscriberCount: profile.subscriberCount || 0
            });

            // Show error toast or notification here if needed
        } finally {
            setIsSubscribing(false);
        }
    };

    // Helper to format duration in min:sec
    function formatDuration(duration) {
        if (!duration && duration !== 0) return '0:00';
        const totalSeconds = Math.round(Number(duration));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
                    onClick={() => userId && dispatch(fetchUserProfile(userId))}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center text-gray-600 p-4">
                <p className="text-xl font-semibold mb-2">User Not Found</p>
                <p>The user profile you're looking for doesn't exist or is not available.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Cover Image + Avatar Overlay */}
                <div className="relative h-40 bg-gray-200">
                    {profile.coverImage && (
                        <img
                            src={profile.coverImage}
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
                            src={profile.avatar || defaultAvatar}
                            alt={profile.full_name || profile.username}
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
                                {profile.full_name || profile.username}
                            </h1>
                            <p className="text-gray-500">@{profile.username}</p>
                        </div>
                        {!isOwnProfile ? (
                            <button
                                onClick={handleSubscribe}
                                disabled={isSubscribing}
                                className={`px-6 py-2 rounded-full transition ${subscriptionStatus.isSubscribed
                                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {isSubscribing
                                    ? 'Processing...'
                                    : subscriptionStatus.isSubscribed
                                        ? 'Subscribed'
                                        : 'Subscribe'}
                            </button>
                        ) : (
                            <Link
                                to="/users/account"
                                className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-100"
                            >
                                View Account
                            </Link>
                        )}
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-500">
                                Subscribers
                            </h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {subscriptionStatus.subscriberCount}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-500">
                                Videos
                            </h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {profile.videoCount || 0}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-500">
                                Views
                            </h3>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {profile.totalViews || 0}
                            </p>
                        </div>
                    </div>

                    {/* User's Videos Section */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Videos</h2>
                            <Link to={`/videos?userId=${profile._id}`} className="text-red-600 hover:text-red-700">
                                View All
                            </Link>
                        </div>

                        {videosLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                            </div>
                        ) : videosError ? (
                            <div className="text-center py-8 text-red-500">
                                {videosError}
                                <button
                                    onClick={fetchUserVideos}
                                    className="ml-2 underline"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : userVideos.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No videos available
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {userVideos.slice(0, 6).map((video) => (
                                    <Link
                                        key={video._id}
                                        to={`/videos/${video._id}`}
                                        className="block group"
                                    >
                                        <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video relative">
                                            <img
                                                src={video.thumbnail || defaultThumbnail}
                                                alt={video.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = defaultThumbnail;
                                                }}
                                            />
                                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                                {formatDuration(video.duration)}
                                            </div>
                                        </div>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2">
                                            {video.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {video.views} views
                                            {/* Only show date if valid */}
                                            {(() => {
                                                const date = new Date(video.createdAt);
                                                return (!isNaN(date.getTime()) && video.createdAt) ? ` • ${date.toLocaleDateString()}` : '';
                                            })()}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 