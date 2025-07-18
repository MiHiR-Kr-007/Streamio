import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import CommentList from '../comment/CommentList';
import CommentForm from '../comment/CommentForm';
import LikeButton from '../like/LikeButton';
import { fetchVideoById } from '../../redux/slices/videoSlice';
import { API_ENDPOINTS } from '../../config/api';
import defaultAvatar from '/images/default-avatar.svg';
import defaultThumbnail from '/images/default-thumbnail.svg';
import ReactPlayer from 'react-player';
import screenfull from 'screenfull';

function formatTime(seconds) {
    if (!seconds && seconds !== 0) return '0:00';
    const totalSeconds = Math.floor(Number(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const VideoDetail = () => {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.user);
    const { isAuthenticated, user: authUser } = useSelector((state) => state.auth);
    const { currentVideo, loading, error } = useSelector((state) => state.video);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [commentRefreshKey, setCommentRefreshKey] = useState(0);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
    const [playlistError, setPlaylistError] = useState('');
    const [playerRef, setPlayerRef] = useState(null);
    const [playing, setPlaying] = useState(true);
    const [played, setPlayed] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const videoRef = useRef(null);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [volume, setVolume] = useState(1);
    const [showFeedback, setShowFeedback] = useState('');
    const [speed, setSpeed] = useState(1);
    const lastTap = useRef({ time: 0, side: null });
    const feedbackTimeout = useRef(null);
    const controlsTimeout = useRef(null);
    const [videoEnded, setVideoEnded] = useState(false);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        if (!videoId) return;
        
        dispatch(fetchVideoById(videoId));

        // Increment view count when video is loaded
        const incrementViewCount = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                await axios.post(
                    API_ENDPOINTS.INCREMENT_VIDEO_VIEW(videoId),
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            } catch (err) {
                console.error('Failed to increment view count:', err);
            }
        };
        
        incrementViewCount();
    }, [dispatch, videoId]);

    useEffect(() => {
        // Check subscription status if both user and video are loaded
        if (isAuthenticated && currentVideo && currentVideo.owner) {
            const checkSubscriptionStatus = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    // Don't check subscription status for own videos
                    if (authUser?._id === currentVideo.owner._id) {
                        setIsSubscribed(false);
                        return;
                    }
                    
                    const response = await axios.get(
                        API_ENDPOINTS.USER_PROFILE(currentVideo.owner._id),
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );
                    console.log('Subscription status response:', response.data);
                    setIsSubscribed(response.data.data.isSubscribed || false);
                } catch (err) {
                    console.error('Failed to check subscription status:', err);
                    setIsSubscribed(false);
                }
            };
            
            checkSubscriptionStatus();
        } else {
            setIsSubscribed(false);
        }
    }, [isAuthenticated, authUser, currentVideo]);

    const handleSubscribe = async () => {
        if (!isAuthenticated || !currentVideo?.owner?._id) {
            navigate('/users/login', { state: { from: `/videos/${videoId}` } });
            return;
        }
        
        // Don't allow subscribing to own channel
        if (authUser?._id === currentVideo.owner._id) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            console.log('Toggling subscription for channel:', currentVideo.owner._id);
            
            const response = await axios.post(
                API_ENDPOINTS.TOGGLE_SUBSCRIPTION(currentVideo.owner._id),
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            console.log('Subscription toggle response:', response.data);
            
            // Toggle the subscription state
            setIsSubscribed(!isSubscribed);
        } catch (err) {
            console.error('Failed to update subscription:', err);
            // Show error to user
            alert('Failed to update subscription. Please try again.');
        }
    };

    const handleCommentAdded = () => {
        // Increment the key to force a refresh of the CommentList
        setCommentRefreshKey(prevKey => prevKey + 1);
    };

    const fetchUserPlaylists = async () => {
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: `/videos/${videoId}` } });
            return;
        }

        setLoadingPlaylists(true);
        setPlaylistError('');
        
        try {
            const token = localStorage.getItem('token');
            
            // Use authUser from Redux state
            if (!authUser || !authUser._id) {
                console.error('User information is missing');
                setPlaylistError('User information is missing. Please try logging out and back in.');
                setLoadingPlaylists(false);
                return;
            }
            
            const response = await axios.get(
                API_ENDPOINTS.USER_PLAYLISTS(authUser._id),
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data && response.data.data) {
                setPlaylists(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch playlists:', err);
            setPlaylistError('Failed to fetch playlists: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const handleOpenPlaylistModal = () => {
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: `/videos/${videoId}` } });
            return;
        }
        
        if (!authUser) {
            console.error('User not authenticated or user information missing');
            alert('Please log in to add videos to playlists');
            navigate('/users/login', { state: { from: `/videos/${videoId}` } });
            return;
        }
        
        fetchUserPlaylists();
        setShowPlaylistModal(true);
    };

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        
        if (!newPlaylistName.trim() || !newPlaylistDescription.trim()) {
            setPlaylistError('Name and description are required');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                API_ENDPOINTS.PLAYLISTS,
                {
                    name: newPlaylistName,
                    description: newPlaylistDescription
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            if (response.data && response.data.data) {
                // Add the new playlist to the list
                setPlaylists([...playlists, response.data.data]);
                // Clear the form
                setNewPlaylistName('');
                setNewPlaylistDescription('');
                setPlaylistError('');
            }
        } catch (err) {
            console.error('Failed to create playlist:', err);
            setPlaylistError(err.response?.data?.message || 'Failed to create playlist');
        }
    };

    const handleAddToPlaylist = async (playlistId) => {
        try {
            console.log(`Adding video ${videoId} to playlist ${playlistId}`);
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No authentication token found');
                setPlaylistError('Authentication token missing. Please log in again.');
                return;
            }
            
            // Use the ADD_VIDEO_TO_PLAYLIST endpoint
            const endpoint = API_ENDPOINTS.ADD_VIDEO_TO_PLAYLIST(videoId, playlistId);
            console.log('API endpoint:', endpoint);
            
            const response = await axios.patch(
                endpoint,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            console.log('Add to playlist response:', response.data);
            
            // Close the modal after adding
            setShowPlaylistModal(false);
            // Show success message
            alert('Video added to playlist successfully');
        } catch (err) {
            console.error('Failed to add video to playlist:', err);
            const errorDetails = err.response ? 
                `Status: ${err.response.status}, Message: ${err.response.data?.message || 'Unknown error'}` : 
                err.message;
            console.error('Error details:', errorDetails);
            setPlaylistError(`Failed to add video to playlist: ${err.response?.data?.message || err.message}`);
        }
    };

    // Removed all showControls, handleMouseMove, showFeedback, and keyboard event logic from the component

    // Keyboard controls and feedback overlays
    useEffect(() => {
        const handleKeyDown = (e) => {
            const video = videoRef.current;
            if (!video) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // Block all controls if video has ended
            if (videoEnded) {
                e.preventDefault();
                return;
            }
            let feedback = '';
            switch (e.key) {
                case ' ':
                    if (video.paused) { video.play(); feedback = 'Play'; } else { video.pause(); feedback = 'Pause'; }
                    e.preventDefault();
                    break;
                case 'm':
                    setMuted((prev) => {
                        if (video) video.muted = !prev;
                        // Show correct feedback: 'Muted' if muting, 'Unmuted' if unmuting
                        setShowFeedback(!prev ? 'Muted' : 'Unmuted');
                        if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
                        feedbackTimeout.current = setTimeout(() => setShowFeedback(''), 1200);
                        return !prev;
                    });
                    break;
                case 'ArrowRight':
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    feedback = '+10s';
                    break;
                case 'ArrowLeft':
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    feedback = '-10s';
                    break;
                case 'ArrowUp':
                    video.volume = Math.min(1, video.volume + 0.1);
                    feedback = 'VOLUME_BAR';
                    setVolume(video.volume);
                    break;
                case 'ArrowDown':
                    video.volume = Math.max(0, video.volume - 0.1);
                    feedback = 'VOLUME_BAR';
                    setVolume(video.volume);
                    break;
                case 'f':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                        feedback = 'Exit Fullscreen';
                    } else {
                        video.parentElement.requestFullscreen();
                        feedback = 'Fullscreen';
                    }
                    break;
                case 'r':
                    video.currentTime = 0;
                    video.play();
                    feedback = 'Replay';
                    break;
                case '>':
                case '.':
                    video.playbackRate = Math.min(2, (video.playbackRate + 0.25));
                    setSpeed(video.playbackRate);
                    feedback = `Speed: ${video.playbackRate.toFixed(2)}x`;
                    break;
                case '<':
                case ',':
                    video.playbackRate = Math.max(0.25, (video.playbackRate - 0.25));
                    setSpeed(video.playbackRate);
                    feedback = `Speed: ${video.playbackRate.toFixed(2)}x`;
                    break;
                default:
                    break;
            }
            if (feedback) {
                setShowFeedback(feedback);
                if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
                feedbackTimeout.current = setTimeout(() => setShowFeedback(''), feedback === 'VOLUME_BAR' ? 800 : 1200);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [videoEnded]);

    // Forcibly pause video if it tries to play while videoEnded is true
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (!videoEnded) return;
        const handlePlayWhileEnded = () => {
            if (videoEnded) {
                video.pause();
            }
        };
        video.addEventListener('play', handlePlayWhileEnded);
        return () => video.removeEventListener('play', handlePlayWhileEnded);
    }, [videoEnded]);

    // Add effect to reset videoEnded when video plays
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handlePlay = () => setVideoEnded(false);
        video.addEventListener('play', handlePlay);
        return () => video.removeEventListener('play', handlePlay);
    }, []);

    // Mobile tap/double-tap gestures
    const handleVideoTouch = (e) => {
        if (videoEnded) return; // Block all controls if video has ended
        const video = videoRef.current;
        if (!video) return;
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const side = x < rect.width / 2 ? 'left' : 'right';
        const now = Date.now();
        if (lastTap.current.time && now - lastTap.current.time < 300 && lastTap.current.side === side) {
            // Double tap
            if (side === 'left') {
                video.currentTime = Math.max(0, video.currentTime - 10);
                setShowFeedback('-10s');
            } else {
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
                setShowFeedback('+10s');
            }
            if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
            feedbackTimeout.current = setTimeout(() => setShowFeedback(''), 1000);
            lastTap.current = { time: 0, side: null };
        } else {
            // Single tap: play/pause
            lastTap.current = { time: now, side };
            setTimeout(() => {
                if (lastTap.current.time && Date.now() - lastTap.current.time >= 300) {
                    if (video.paused) { video.play(); setShowFeedback('Play'); } else { video.pause(); setShowFeedback('Pause'); }
                    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
                    feedbackTimeout.current = setTimeout(() => setShowFeedback(''), 1000);
                    lastTap.current = { time: 0, side: null };
                }
            }, 320);
        }
    };

    // Clean up feedback timeout on unmount
    useEffect(() => () => { if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current); }, []);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = muted;
        }
    }, [muted]);

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
                    onClick={() => dispatch(fetchVideoById(videoId))}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!currentVideo || !currentVideo.videoFile) {
        console.log('VideoDetail: currentVideo or videoFile missing', currentVideo);
        return <div className="p-8 text-center text-red-600">Video not found or video file missing.</div>;
    }

    console.log('ReactPlayer video URL:', currentVideo.videoFile);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div
                        id="react-player-container"
                        className="aspect-w-16 aspect-h-9 bg-black rounded-lg flex items-center justify-center relative"
                    >
                        <video
                            ref={videoRef}
                            src={currentVideo.videoFile}
                            controls
                            autoPlay
                            style={{ width: '100%', maxHeight: '80vh', background: 'black' }}
                            poster={currentVideo.thumbnail || defaultThumbnail}
                            onError={e => console.error('<video> error:', e)}
                            tabIndex="0"
                            onTouchStart={handleVideoTouch}
                            onEnded={() => setVideoEnded(true)}
                        />
                        {/* Feedback Overlay for keyboard/touch actions */}
                        {showFeedback && showFeedback !== 'VOLUME_BAR' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-3xl font-bold bg-black/60 px-6 py-2 rounded z-20">
                                {showFeedback}
                            </div>
                        )}
                        {showFeedback === 'VOLUME_BAR' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                                <div className="mb-2 text-white text-lg font-bold">Volume</div>
                                <div className="w-40 h-4 bg-gray-700 rounded-full overflow-hidden shadow-lg">
                                    <div className="h-4 bg-green-400 transition-all duration-200" style={{ width: `${Math.round(volume * 100)}%` }}></div>
                                </div>
                                <div className="mt-1 text-white text-sm">{Math.round(volume * 100)}%</div>
                            </div>
                        )}
                        {/* Replay Overlay after video ends */}
                        {videoEnded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
                                <button
                                    onClick={() => {
                                        if (videoRef.current) {
                                            videoRef.current.currentTime = 0;
                                            videoRef.current.play();
                                            setVideoEnded(false);
                                        }
                                    }}
                                    className="text-white text-2xl font-bold bg-red-600 px-8 py-4 rounded-lg shadow-lg hover:bg-red-700 focus:outline-none cursor-pointer"
                                >
                                    Replay
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Video Description and Details */}
                    <div className="mt-6 text-left">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentVideo.title}</h2>
                        <div className="flex items-center space-x-3 mb-2">
                            <img
                                src={currentVideo.owner?.avatar || defaultAvatar}
                                alt={currentVideo.owner?.username || 'User'}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = defaultAvatar;
                                }}
                            />
                            <div>
                                <Link to={`/users/${currentVideo.owner?._id}`} className="font-semibold text-gray-900 hover:text-red-600">
                                    {currentVideo.owner?.full_name || currentVideo.owner?.username || 'User'}
                                </Link>
                                <p className="text-sm text-gray-600">
                                    {currentVideo.owner?.subscribers || 0} subscribers
                                </p>
                            </div>
                            {isAuthenticated && authUser?._id !== currentVideo.owner?._id && (
                                <button
                                    onClick={handleSubscribe}
                                    className={`ml-auto px-4 py-2 rounded-full text-sm font-medium transition focus:outline-none ${isSubscribed ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                >
                                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                                </button>
                            )}
                        </div>
                        <p className="text-gray-800 whitespace-pre-line text-left">{currentVideo.description}</p>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-8 text-left">
                        <h3 className="text-lg font-semibold mb-4">Comments</h3>
                        {isAuthenticated ? (
                            <CommentForm videoId={videoId} onCommentAdded={handleCommentAdded} />
                        ) : (
                            <div className="p-4 bg-gray-50 rounded-lg mb-4">
                                <p className="text-gray-700">
                                    <Link to="/users/login" className="text-blue-600 hover:underline">Sign in</Link> to leave a comment
                                </p>
                            </div>
                        )}
                        <CommentList key={commentRefreshKey} videoId={videoId} />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {/* Remove the related videos section entirely */}
                </div>
            </div>

            {/* Playlist Modal */}
            {showPlaylistModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Save to...</h2>
                            <button
                                onClick={() => setShowPlaylistModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        
                        {playlistError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {playlistError}
                            </div>
                        )}
                        
                        {loadingPlaylists ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-600"></div>
                            </div>
                        ) : (
                            <>
                                {playlists.length > 0 ? (
                                    <div className="space-y-2 mb-6">
                                        {playlists.map((playlist) => (
                                            <div
                                                key={playlist._id}
                                                className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg"
                                            >
                                                <span className="font-medium">{playlist.name}</span>
                                                <button
                                                    onClick={() => handleAddToPlaylist(playlist._id)}
                                                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 mb-4">You don't have any playlists yet.</p>
                                )}
                                
                                <div className="border-t pt-4">
                                    <h3 className="font-medium mb-2">Create new playlist</h3>
                                    <form onSubmit={handleCreatePlaylist}>
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                placeholder="Playlist name"
                                                value={newPlaylistName}
                                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <textarea
                                                placeholder="Description"
                                                value={newPlaylistDescription}
                                                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                rows="3"
                                                required
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            Create
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoDetail; 