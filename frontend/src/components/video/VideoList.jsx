import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideos } from '../../redux/slices/videoSlice';
import defaultAvatar from '/images/default-avatar.svg';
import defaultThumbnail from '/images/default-thumbnail.svg';

// Helper to format duration in min:sec
function formatDuration(duration) {
    if (!duration && duration !== 0) return '0:00';
    const totalSeconds = Math.floor(Number(duration));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const VideoList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { videos, loading, error } = useSelector((state) => state.video);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');

    useEffect(() => {
        if (userId) {
            dispatch(fetchVideos({ userId }));
        } else {
            dispatch(fetchVideos());
        }
    }, [dispatch, userId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (error && error !== 'No videos found') {
        return (
            <div className="text-center text-red-600 p-4">
                <p className="text-xl font-semibold mb-2">Error</p>
                <p>{error}</p>
                {error === 'Failed to fetch videos' && (
                    <button 
                        onClick={() => dispatch(fetchVideos())}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Try Again
                    </button>
                )}
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    {userId ? 'No Videos Available for this User' : 'No Videos Available'}
                </h2>
                <p className="text-gray-500">
                    {userId ? 'This user has not published any videos yet.' : 'There are currently no videos to display.'}
                </p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Explore Videos</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                    <Link
                        key={video._id}
                        to={`/videos/${video._id}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                        <div className="relative">
                            <img
                                src={video.thumbnail || defaultThumbnail}
                                alt={video.title}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                    e.target.src = defaultThumbnail;
                                }}
                            />
                            <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                                {formatDuration(video.duration)}
                            </span>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center space-x-3 mb-2">
                                <img
                                    src={video.owner?.avatar || defaultAvatar}
                                    alt={video.owner?.username || 'User'}
                                    className="w-10 h-10 rounded-full"
                                    onError={(e) => {
                                        e.target.src = defaultAvatar;
                                    }}
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                                        {video.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">{video.owner?.username || 'Unknown User'}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>{video.views || 0} views</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default VideoList; 