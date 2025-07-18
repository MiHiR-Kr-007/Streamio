import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommentSection = ({ contentId, contentType }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [contentId]);

    const fetchComments = async () => {
        try {
            const response = await axios.get(`/api/v1/comments/${contentType}/${contentId}`);
            setComments(response.data.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            const response = await axios.post(`/api/v1/comments/${contentType}/${contentId}`, {
                content: newComment
            });
            setComments([...comments, response.data.data]);
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (commentId) => {
        try {
            await axios.delete(`/api/v1/comments/${commentId}`);
            setComments(comments.filter(comment => comment._id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Comments</h3>

            <form onSubmit={handleSubmit} className="mb-6">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? 'Posting...' : 'Post Comment'}
                </button>
            </form>

            <div className="space-y-4">
                {comments.map((comment) => (
                    <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={comment.owner.avatar}
                                    alt={comment.owner.username}
                                    className="w-8 h-8 rounded-full"
                                />
                                <div>
                                    <p className="font-semibold">{comment.owner.username}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(comment._id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Delete
                            </button>
                        </div>
                        <p className="mt-2 text-gray-700">{comment.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommentSection; 