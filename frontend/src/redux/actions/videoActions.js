import axios from 'axios';

// Upload Video
export const uploadVideo = (formData) => async (dispatch) => {
    try {
        const res = await axios.post('/api/videos/upload', formData);
        dispatch({ type: 'UPLOAD_VIDEO_SUCCESS', payload: res.data });
    } catch (err) {
        dispatch({ type: 'UPLOAD_VIDEO_FAIL', payload: err.response.data });
    }
}; 