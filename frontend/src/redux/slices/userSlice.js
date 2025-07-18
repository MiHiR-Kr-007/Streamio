import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Async thunks for user actions
export const fetchUserProfile = createAsyncThunk(
    'user/fetchProfile',
    async (userId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.USER_PROFILE(userId), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
        }
    }
);

export const updateUserProfile = createAsyncThunk(
    'user/updateProfile',
    async (userData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(API_ENDPOINTS.UPDATE_PROFILE, userData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
        }
    }
);

export const subscribeToUser = createAsyncThunk(
    'user/subscribe',
    async (userId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                API_ENDPOINTS.TOGGLE_SUBSCRIPTION(userId),
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );
            return { ...response.data.data, userId };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to subscribe');
        }
    }
);

export const unsubscribeFromUser = createAsyncThunk(
    'user/unsubscribe',
    async (userId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                API_ENDPOINTS.TOGGLE_SUBSCRIPTION(userId),
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );
            return { ...response.data.data, userId };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to unsubscribe');
        }
    }
);

export const fetchUserVideos = createAsyncThunk(
    'user/fetchVideos',
    async (userId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_ENDPOINTS.USER_PROFILE(userId)}/videos`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user videos');
        }
    }
);

export const fetchUserPlaylists = createAsyncThunk(
    'user/fetchPlaylists',
    async (userId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_ENDPOINTS.USER_PROFILE(userId)}/playlists`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user playlists');
        }
    }
);

const initialState = {
    currentUser: null,
    profile: null,
    videos: [],
    playlists: [],
    subscribers: [],
    subscriptions: [],
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setUser: (state, action) => {
            state.currentUser = action.payload;
        },
        setCurrentUser: (state, action) => {
            state.currentUser = action.payload;
        },
        clearUserState: (state) => {
            state.currentUser = null;
            state.profile = null;
            state.videos = [];
            state.playlists = [];
            state.subscribers = [];
            state.subscriptions = [];
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch User Profile
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch user profile';
            })
            // Update User Profile
            .addCase(updateUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
                if (state.currentUser?._id === action.payload._id) {
                    state.currentUser = action.payload;
                }
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update profile';
            })
            // Subscribe to User
            .addCase(subscribeToUser.pending, (state) => {
                state.error = null;
            })
            .addCase(subscribeToUser.fulfilled, (state, action) => {
                if (state.profile && state.profile._id === action.payload.userId) {
                    state.profile = {
                        ...state.profile,
                        isSubscribed: true,
                        subscriberCount: (state.profile.subscriberCount || 0) + 1
                    };
                }
            })
            .addCase(subscribeToUser.rejected, (state, action) => {
                state.error = action.payload?.message || 'Failed to subscribe';
            })
            // Unsubscribe from User
            .addCase(unsubscribeFromUser.pending, (state) => {
                state.error = null;
            })
            .addCase(unsubscribeFromUser.fulfilled, (state, action) => {
                if (state.profile && state.profile._id === action.payload.userId) {
                    state.profile = {
                        ...state.profile,
                        isSubscribed: false,
                        subscriberCount: Math.max(0, (state.profile.subscriberCount || 0) - 1)
                    };
                }
            })
            .addCase(unsubscribeFromUser.rejected, (state, action) => {
                state.error = action.payload?.message || 'Failed to unsubscribe';
            })
            // Fetch User Videos
            .addCase(fetchUserVideos.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserVideos.fulfilled, (state, action) => {
                state.loading = false;
                state.videos = action.payload;
            })
            .addCase(fetchUserVideos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch user videos';
            })
            // Fetch User Playlists
            .addCase(fetchUserPlaylists.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserPlaylists.fulfilled, (state, action) => {
                state.loading = false;
                state.playlists = action.payload;
            })
            .addCase(fetchUserPlaylists.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch user playlists';
            });
    },
});

export const {
    clearError,
    setError,
    setLoading,
    setUser,
    setCurrentUser,
    clearUserState,
} = userSlice.actions;

export default userSlice.reducer; 