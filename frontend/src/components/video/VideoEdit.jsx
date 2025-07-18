import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import defaultThumbnail from '/images/default-thumbnail.svg';

const VideoEdit = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [video, setVideo] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnail, setThumbnail] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchVideo = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(API_ENDPOINTS.VIDEO_DETAIL(videoId), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = response.data.data;
                setVideo(data);
                setTitle(data.title);
                setDescription(data.description);
                setPreview(data.thumbnail || defaultThumbnail);
            } catch (err) {
                setError('Failed to fetch video data');
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [videoId]);

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        setThumbnail(file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            if (thumbnail) {
                formData.append('thumbnail', thumbnail);
            }
            await axios.patch(`${API_ENDPOINTS.VIDEOS}/${videoId}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccess(true);
            setTimeout(() => navigate(`/videos/${videoId}`), 1500);
        } catch (err) {
            setError('Failed to update video');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!video) return <div className="p-8 text-center">Video not found.</div>;

    return (
        <div className="max-w-xl mx-auto bg-white p-8 rounded shadow mt-8">
            <h2 className="text-2xl font-bold mb-4">Edit Video</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Title</label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Description</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-1 font-medium">Thumbnail</label>
                    <input type="file" accept="image/*" onChange={handleThumbnailChange} />
                    {preview && (
                        <img src={preview} alt="Thumbnail preview" className="mt-2 h-32 rounded" />
                    )}
                </div>
                <button
                    type="submit"
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                >
                    Save Changes
                </button>
                {success && <div className="mt-4 text-green-600">Video updated! Redirecting...</div>}
            </form>
        </div>
    );
};

export default VideoEdit; 