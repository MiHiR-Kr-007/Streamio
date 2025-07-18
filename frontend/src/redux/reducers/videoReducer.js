const initialState = {
    videos: [],
    loading: false,
    error: null
};

const videoReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'UPLOAD_VIDEO_SUCCESS':
            return {
                ...state,
                videos: [...state.videos, action.payload],
                loading: false,
                error: null
            };
        case 'UPLOAD_VIDEO_FAIL':
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        default:
            return state;
    }
};

export default videoReducer; 