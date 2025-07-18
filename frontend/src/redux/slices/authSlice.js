import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../config/api.js';

// Helper to store token in localStorage
const storeTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('token', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

// Helper to remove tokens from localStorage
const removeTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
};

// Track if we're currently checking authentication to prevent duplicate requests
let authCheckInProgress = false;

// Async thunks
export const register = createAsyncThunk(
    'auth/register',
    async (formData, { rejectWithValue }) => {
        try {
            // Ensure we're not setting Content-Type header manually for FormData
            const fetchOptions = {
                method: 'POST',
                credentials: 'include',
                body: formData
            };

            const response = await fetch(API_ENDPOINTS.REGISTER, fetchOptions);
            const data = await response.json();

            if (!response.ok) {
                // Handle different error response formats
                const errorMessage = data.message || data.error || data.errorMessage || 'Registration failed';
                return rejectWithValue(errorMessage);
            }

            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Registration failed');
        }
    }
);

export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await fetch(API_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(credentials),
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                // If response is not JSON (e.g., HTML error page), show a friendly error
                return rejectWithValue('Invalid credentials or server error.');
            }

            if (!response.ok) {
                return rejectWithValue(data.message || 'Login failed');
            }

            // Store tokens in localStorage for persistence
            if (data.data?.accessToken) {
                storeTokens(data.data.accessToken, data.data.refreshToken);
            }

            return data;
        } catch (error) {
            return rejectWithValue('Invalid credentials or server error.');
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            // Remove tokens immediately to ensure UI updates quickly
            removeTokens();

            // Then attempt to notify the server (but don't wait for it)
            const token = localStorage.getItem('token');

            // Use a timeout to prevent hanging on logout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Logout request timed out')), 3000);
            });

            // Try to notify the server but don't block on it
            Promise.race([
                fetch(API_ENDPOINTS.LOGOUT, {
                    method: 'POST',
                    credentials: 'include',
                    headers: token ? {
                        'Authorization': `Bearer ${token}`
                    } : {}
                }),
                timeoutPromise
            ]).catch(error => {
                console.log('Logout notification to server failed:', error);
                // This is non-blocking, we've already cleared local state
            });

            // Return success immediately
            return { success: true };
        } catch (error) {
            // Still ensure tokens are removed on error
            removeTokens();
            return { success: true };
        }
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { rejectWithValue, getState }) => {
        // Prevent duplicate requests
        if (authCheckInProgress) {
            return rejectWithValue('Auth check already in progress');
        }

        // Check if we already have user data
        const { auth } = getState();
        if (auth.user) {
            return { data: auth.user };
        }

        try {
            authCheckInProgress = true;
            let token = localStorage.getItem('token');
            if (!token) {
                authCheckInProgress = false;
                return rejectWithValue('No token found');
            }

            let response = await fetch(API_ENDPOINTS.CURRENT_USER, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            let data = await response.json();

            if (!response.ok && response.status === 401) {
                // Try to refresh the access token
                const refreshResponse = await fetch(API_ENDPOINTS.REFRESH_TOKEN || `${API_ENDPOINTS.LOGIN.replace('/login','/refresh-access-token')}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const refreshData = await refreshResponse.json();
                if (refreshResponse.ok && refreshData.data?.accessToken) {
                    // Store new access token
                    storeTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
                    token = refreshData.data.accessToken;
                    // Retry original request with new token
                    response = await fetch(API_ENDPOINTS.CURRENT_USER, {
                        credentials: 'include',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    data = await response.json();
                    if (!response.ok) {
                        if (response.status === 401) {
                            removeTokens();
                        }
                        authCheckInProgress = false;
                        return rejectWithValue(data.message || 'Failed to get current user after refresh');
                    }
                } else {
                    // Refresh failed, log out
                    removeTokens();
                    authCheckInProgress = false;
                    return rejectWithValue(refreshData.message || 'Session expired, please log in again');
                }
            } else if (!response.ok) {
                if (response.status === 401) {
                    removeTokens();
                }
                authCheckInProgress = false;
                return rejectWithValue(data.message || 'Failed to get current user');
            }

            authCheckInProgress = false;
            return data;
        } catch (error) {
            authCheckInProgress = false;
            return rejectWithValue(error.message || 'Failed to get current user');
        }
    }
);

const initialState = {
    user: null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setError: (state, action) => {
            state.error = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.data?.user || null;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Logout
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            })
            // Get Current User
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.data || null;
            })
            .addCase(getCurrentUser.rejected, (state, action) => {
                // Don't change authentication state if we're just preventing duplicate requests
                if (action.payload === 'Auth check already in progress') {
                    state.loading = false;
                    return;
                }
                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
            });
    },
});

export const { setError, setLoading, clearError } = authSlice.actions;
export default authSlice.reducer;