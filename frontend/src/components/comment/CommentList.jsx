import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import LikeButton from '../like/LikeButton';
import defaultAvatar from '/images/default-avatar.svg';

const CommentList = ({ videoId }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${API_ENDPOINTS.VIDEO_COMMENTS(videoId)}`,
                    {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    }
                );
                setComments(response.data.data || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching comments:', err);
                if (err.response && err.response.status === 404) {
                    // No comments found, but this isn't an error
                    setComments([]);
                    setError(null);
                } else {
                    setError('Failed to load comments. Please try again later.');
                }
                setLoading(false);
            }
        };

        fetchComments();
    }, [videoId, refreshKey]);

    const handleCommentLikeToggle = (commentData) => {
        // Update the local comment state to avoid a full refresh
        setComments(prevComments =>
            prevComments.map(comment =>
                comment._id === commentData.contentId
                    ? { ...comment, likes: commentData.likeCount, isLiked: commentData.isLiked }
                    : comment
            )
        );

        // Trigger a refresh after a short delay to ensure backend sync
        setTimeout(() => {
            setRefreshKey(prevKey => prevKey + 1);
        }, 2000);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600">
                <p>{error}</p>
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                <p>No comments yet. Be the first to comment!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {comments.map((comment) => (
                <div key={comment._id} className="flex space-x-4">
                    <Link to={`/users/${comment.owner._id}`}>
                        <img
                            src={comment.owner.avatar || defaultAvatar}
                            alt={comment.owner.username}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                                e.target.src = defaultAvatar;
                            }}
                        />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <Link
                                to={`/users/${comment.owner._id}`}
                                className="font-semibold hover:underline"
                            >
                                {comment.owner.username}
                            </Link>
                            <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="mt-1 text-gray-800">{comment.content}</p>
                        <div className="mt-2 flex items-center space-x-4">
                            <LikeButton
                                contentId={comment._id}
                                contentType="comment"
                                initialLikes={comment.likes || 0}
                                initialIsLiked={comment.isLiked || false}
                                size="sm"
                                onLikeToggle={handleCommentLikeToggle}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CommentList; 