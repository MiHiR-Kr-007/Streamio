import React, { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

const CommentForm = ({ videoId, onCommentAdded }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_ENDPOINTS.VIDEO_COMMENTS(videoId)}`,
                { content },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setContent('');
            if (onCommentAdded && typeof onCommentAdded === 'function') {
                onCommentAdded(response.data.data);
            }
        } catch (err) {
            console.error('Comment post error:', err);
            setError('Failed to post comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex space-x-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows="3"
                />
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <div className="mt-2 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className={`px-4 py-2 rounded-lg ${isSubmitting || !content.trim()
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                >
                    {isSubmitting ? 'Posting...' : 'Comment'}
                </button>
            </div>
        </form>
    );
};

export default CommentForm; 