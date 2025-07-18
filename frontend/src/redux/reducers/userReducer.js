const initialState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
};

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'REGISTER_SUCCESS':
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                loading: false,
                error: null
            };
        case 'REGISTER_FAIL':
        case 'LOGIN_FAIL':
        case 'LOGOUT_FAIL':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                loading: false,
                error: action.payload
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null
            };
        default:
            return state;
    }
};

export default userReducer; 