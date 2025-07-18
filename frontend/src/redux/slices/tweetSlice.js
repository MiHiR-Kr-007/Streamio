import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

// Async thunks
export const fetchTweets = createAsyncThunk(
    'tweet/fetchTweets',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.TWEETS, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch tweets');
        }
    }
);

export const createTweet = createAsyncThunk(
    'tweet/createTweet',
    async (tweetData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                API_ENDPOINTS.TWEETS,
                tweetData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create tweet');
        }
    }
);

const initialState = {
    tweets: [],
    loading: false,
    error: null
};

const tweetSlice = createSlice({
    name: 'tweet',
    initialState,
    reducers: {
        setTweets: (state, action) => {
            state.tweets = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        updateTweetLike: (state, action) => {
            const { tweetId, isLiked, likes } = action.payload;
            const tweetIndex = state.tweets.findIndex(tweet => tweet._id === tweetId);

            if (tweetIndex !== -1) {
                state.tweets[tweetIndex].isLiked = isLiked;
                state.tweets[tweetIndex].likes = likes;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch tweets
            .addCase(fetchTweets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTweets.fulfilled, (state, action) => {
                state.tweets = action.payload;
                state.loading = false;
            })
            .addCase(fetchTweets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create tweet
            .addCase(createTweet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTweet.fulfilled, (state, action) => {
                state.tweets.unshift(action.payload);
                state.loading = false;
            })
            .addCase(createTweet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { setTweets, setLoading, setError, clearError, updateTweetLike } = tweetSlice.actions;
export default tweetSlice.reducer; 