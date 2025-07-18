import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setTweets, setLoading, setError } from '../../redux/slices/tweetSlice';
import axios from 'axios';

const UserTweet = () => {
    const [tweet, setTweet] = useState('');
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(setLoading(true));
        try {
            const response = await axios.post('/api/tweets', { content: tweet });
            dispatch(setTweets([response.data]));
            dispatch(setError(null));
            setTweet('');
        } catch (error) {
            dispatch(setError(error.response.data.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Tweet</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">What's on your mind?</label>
                        <textarea
                            value={tweet}
                            onChange={(e) => setTweet(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    >
                        Tweet
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserTweet; 