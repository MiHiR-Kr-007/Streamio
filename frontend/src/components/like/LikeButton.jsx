import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

const LikeButton = ({
    contentId,
    contentType,
    initialLikes = 0,
    initialIsLiked = false,
    size = 'md',
    onLikeToggle = null
}) => {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(initialLikes);
    const [isFetching, setIsFetching] = useState(false);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Update state when props change
    useEffect(() => {
        setIsLiked(initialIsLiked);
        setLikeCount(initialLikes);
    }, [initialIsLiked, initialLikes]);

    // Fetch the like status from the server when component mounts
    useEffect(() => {
        const fetchLikeStatus = async () => {
            if (!isAuthenticated || !contentId) return;

            try {
                setIsFetching(true);
                const token = localStorage.getItem('token');
                if (!token) return;

                // Convert contentType to the format expected by the API
                let apiContentType;
                switch (contentType) {
                    case 'video':
                        apiContentType = 'v';
                        break;
                    case 'comment':
                        apiContentType = 'c';
                        break;
                    case 'tweet':
                        apiContentType = 't';
                        break;
                    default:
                        throw new Error(`Unsupported content type: ${contentType}`);
                }

                const response = await axios.get(
                    API_ENDPOINTS.LIKE_STATUS(apiContentType, contentId),
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const { isLiked: serverIsLiked, likeCount: serverLikeCount } = response.data.data;

                // Only update if different from current state
                if (serverIsLiked !== isLiked) {
                    setIsLiked(serverIsLiked);
                }

                if (serverLikeCount !== likeCount) {
                    setLikeCount(serverLikeCount);
                }
            } catch (error) {
                console.error(`Error fetching ${contentType} like status:`, error);
            } finally {
                setIsFetching(false);
            }
        };

        fetchLikeStatus();
    }, [contentId, contentType, isAuthenticated]);

    const getEndpoint = () => {
        switch (contentType) {
            case 'video':
                return API_ENDPOINTS.TOGGLE_VIDEO_LIKE(contentId);
            case 'comment':
                return API_ENDPOINTS.TOGGLE_COMMENT_LIKE(contentId);
            case 'tweet':
                return API_ENDPOINTS.TOGGLE_TWEET_LIKE(contentId);
            default:
                throw new Error(`Unsupported content type: ${contentType}`);
        }
    };

    const handleLikeToggle = async () => {
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: window.location.pathname } });
            return;
        }

        if (isFetching) return; // Prevent multiple clicks while processing

        try {
            setIsFetching(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                navigate('/users/login', { state: { from: window.location.pathname } });
                return;
            }

            const response = await axios.post(
                getEndpoint(),
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update local state
            const newIsLiked = !isLiked;
            const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;

            setIsLiked(newIsLiked);
            setLikeCount(newLikeCount);

            // Call the callback if provided
            if (onLikeToggle && typeof onLikeToggle === 'function') {
                onLikeToggle({
                    contentId,
                    contentType,
                    isLiked: newIsLiked,
                    likeCount: newLikeCount
                });
            }
        } catch (error) {
            console.error(`Error toggling ${contentType} like:`, error);
        } finally {
            setIsFetching(false);
        }
    };

    // Size classes
    const sizeClasses = {
        sm: 'h-4 w-4 text-sm',
        md: 'h-5 w-5 text-base',
        lg: 'h-6 w-6 text-lg'
    };

    return (
        <button
            onClick={handleLikeToggle}
            disabled={isFetching}
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                } ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isLiked ? 'Unlike' : 'Like'}
        >
            <svg
                className={sizeClasses[size] || sizeClasses.md}
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            <span>{likeCount}</span>
        </button>
    );
};

export default LikeButton; 