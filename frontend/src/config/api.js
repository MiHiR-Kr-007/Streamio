// const API_BASE_URL = 'http://localhost:5000/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-backend-domain.com/api/v1';

export const API_ENDPOINTS = {
    // Auth endpoints
    REGISTER: `${API_BASE_URL}/users/register`,
    LOGIN: `${API_BASE_URL}/users/login`,
    LOGOUT: `${API_BASE_URL}/users/logout`,
    CURRENT_USER: `${API_BASE_URL}/users/current-user`,

    // User endpoints
    USER_PROFILE: (userId) => `${API_BASE_URL}/users/${userId}`,
    USER_ACCOUNT: `${API_BASE_URL}/users/account`,
    UPDATE_PROFILE: `${API_BASE_URL}/users/update-profile`,

    // Video endpoints
    VIDEOS: `${API_BASE_URL}/videos`,
    VIDEO_DETAIL: (videoId) => `${API_BASE_URL}/videos/${videoId}`,
    UPLOAD_VIDEO: `${API_BASE_URL}/videos/upload`,
    INCREMENT_VIDEO_VIEW: (videoId) => `${API_BASE_URL}/videos/${videoId}/view`,

    // Comment endpoints
    COMMENTS: `${API_BASE_URL}/comments`,
    VIDEO_COMMENTS: (videoId) => `${API_BASE_URL}/comments/${videoId}`,
    COMMENT_DETAIL: (commentId) => `${API_BASE_URL}/comments/c/${commentId}`,

    // Like endpoints
    TOGGLE_VIDEO_LIKE: (videoId) => `${API_BASE_URL}/likes/toggle/v/${videoId}`,
    TOGGLE_COMMENT_LIKE: (commentId) => `${API_BASE_URL}/likes/toggle/c/${commentId}`,
    TOGGLE_TWEET_LIKE: (tweetId) => `${API_BASE_URL}/likes/toggle/t/${tweetId}`,
    LIKED_VIDEOS: `${API_BASE_URL}/likes/videos`,
    LIKE_STATUS: (contentType, contentId) => `${API_BASE_URL}/likes/status/${contentType}/${contentId}`,

    // Tweet endpoints
    TWEETS: `${API_BASE_URL}/tweets`,
    USER_TWEETS: (userId) => `${API_BASE_URL}/tweets/user/${userId}`,
    TWEET_DETAIL: (tweetId) => `${API_BASE_URL}/tweets/${tweetId}`,

    // Subscription endpoints
    TOGGLE_SUBSCRIPTION: (channelId) => `${API_BASE_URL}/subscriptions/c/${channelId}`,
    GET_CHANNEL_SUBSCRIBERS: (channelId) => `${API_BASE_URL}/subscriptions/u/${channelId}`,
    GET_SUBSCRIBED_CHANNELS: (channelId) => `${API_BASE_URL}/subscriptions/c/${channelId}`,

    // Playlist endpoints
    PLAYLISTS: `${API_BASE_URL}/playlist`,
    USER_PLAYLISTS: (userId) => `${API_BASE_URL}/playlist/user/${userId}`,
    PLAYLIST_DETAIL: (playlistId) => `${API_BASE_URL}/playlist/${playlistId}`,
    ADD_VIDEO_TO_PLAYLIST: (videoId, playlistId) => `${API_BASE_URL}/playlist/${playlistId}/videos/${videoId}`,
    REMOVE_VIDEO_FROM_PLAYLIST: (videoId, playlistId) => `${API_BASE_URL}/playlist/${playlistId}/videos/${videoId}`,

    // Dashboard endpoints
    DASHBOARD: `${API_BASE_URL}/dashboard`,
    WATCH_HISTORY: `${API_BASE_URL}/dashboard/watch-history`,
    REMOVE_FROM_WATCH_HISTORY: (videoId) => `${API_BASE_URL}/dashboard/watch-history/${videoId}`,
};

export default API_BASE_URL; 