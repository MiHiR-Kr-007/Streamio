import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setVideos, setLoading, setError } from '../../redux/slices/videoSlice';
import axios from 'axios';

const UserVideoUpload = () => {
    const [video, setVideo] = useState(null);
    const dispatch = useDispatch();

    const handleChange = (e) => {
        setVideo(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('video', video);
        dispatch(setLoading(true));
        try {
            const response = await axios.post('/api/videos/upload', formData);
            dispatch(setVideos([response.data]));
            dispatch(setError(null));
            setVideo(null);
        } catch (error) {
            dispatch(setError(error.response.data.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Upload Video</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Choose Video</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    >
                        Upload
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserVideoUpload; 