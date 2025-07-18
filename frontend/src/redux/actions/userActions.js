import axios from 'axios';

// Register User
export const registerUser = (formData) => async (dispatch) => {
    try {
        const res = await axios.post('/api/users/register', formData);
        dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
    } catch (err) {
        dispatch({ type: 'REGISTER_FAIL', payload: err.response.data });
    }
};

// Login User
export const loginUser = (formData) => async (dispatch) => {
    try {
        const res = await axios.post('/api/users/login', formData);
        dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    } catch (err) {
        dispatch({ type: 'LOGIN_FAIL', payload: err.response.data });
    }
};

// Logout User
export const logoutUser = () => async (dispatch) => {
    try {
        await axios.post('/api/users/logout');
        dispatch({ type: 'LOGOUT' });
    } catch (err) {
        dispatch({ type: 'LOGOUT_FAIL', payload: err.response.data });
    }
}; 