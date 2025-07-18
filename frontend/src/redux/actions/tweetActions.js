import axios from 'axios';

// Create Tweet
export const createTweet = (tweetData) => async (dispatch) => {
    try {
        const res = await axios.post('/api/tweets', tweetData);
        dispatch({ type: 'CREATE_TWEET_SUCCESS', payload: res.data });
    } catch (err) {
        dispatch({ type: 'CREATE_TWEET_FAIL', payload: err.response.data });
    }
}; 