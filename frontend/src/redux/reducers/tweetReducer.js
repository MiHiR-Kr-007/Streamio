const initialState = {
    tweets: [],
    loading: false,
    error: null
};

const tweetReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'CREATE_TWEET_SUCCESS':
            return {
                ...state,
                tweets: [...state.tweets, action.payload],
                loading: false,
                error: null
            };
        case 'CREATE_TWEET_FAIL':
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        default:
            return state;
    }
};

export default tweetReducer; 