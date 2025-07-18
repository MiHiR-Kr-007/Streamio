import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import tweetReducer from './slices/tweetSlice';
import videoReducer from './slices/videoSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        tweet: tweetReducer,
        video: videoReducer
    }
});

export default store; 