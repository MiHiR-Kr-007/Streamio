import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Async thunks
export const fetchVideos = createAsyncThunk(
    'video/fetchVideos',
    async (params = {}, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            let url = API_ENDPOINTS.VIDEOS;
            if (params.userId) {
                url += `?userId=${params.userId}`;
            }
            const response = await axios.get(url, {
                withCredentials: true,
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            return response.data.data || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch videos');
        }
    }
);

export const fetchVideoById = createAsyncThunk(
    'video/fetchVideoById',
    async (videoId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.VIDEO_DETAIL(videoId), {
                withCredentials: true,
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch video');
        }
    }
);

export const uploadVideo = createAsyncThunk(
    'video/uploadVideo',
    async (videoData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(API_ENDPOINTS.VIDEOS, videoData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload video');
        }
    }
);

const initialState = {
    videos: [],
    currentVideo: null,
    loading: false,
    error: null
};

const videoSlice = createSlice({
    name: 'video',
    initialState,
    reducers: {
        setVideos: (state, action) => {
            state.videos = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Videos
            .addCase(fetchVideos.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVideos.fulfilled, (state, action) => {
                state.loading = false;
                state.videos = action.payload;
            })
            .addCase(fetchVideos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Video By ID
            .addCase(fetchVideoById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVideoById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentVideo = action.payload;
            })
            .addCase(fetchVideoById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Upload Video
            .addCase(uploadVideo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadVideo.fulfilled, (state, action) => {
                state.loading = false;
                state.videos = [action.payload, ...state.videos];
            })
            .addCase(uploadVideo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { setVideos, setLoading, setError, clearError } = videoSlice.actions;
export default videoSlice.reducer; 