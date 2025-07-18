import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createTweet } from '../../redux/slices/tweetSlice';

const TweetCreate = () => {
    const [content, setContent] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.tweet);
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: '/tweets/create' } });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        const resultAction = await dispatch(createTweet({ content }));

        if (createTweet.fulfilled.match(resultAction)) {
            navigate('/tweets');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create Tweet</h1>
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
                <div className="space-y-4">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's happening?"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        rows="4"
                    />

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !content.trim()}
                            className={`px-4 py-2 rounded-lg ${loading || !content.trim()
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                        >
                            {loading ? 'Posting...' : 'Tweet'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default TweetCreate; 