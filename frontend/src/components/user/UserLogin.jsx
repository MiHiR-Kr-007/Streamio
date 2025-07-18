import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, clearError } from '../../redux/slices/authSlice';
import { setCurrentUser } from '../../redux/slices/userSlice';

const UserLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

    // Get the redirect path from location state or default to home
    const from = location.state?.from || '/';

    useEffect(() => {
        // Redirect if user is already authenticated
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const resultAction = await dispatch(login(formData)).unwrap();
            if (resultAction.data) {
                dispatch(setCurrentUser(resultAction.data));
                navigate(from, { replace: true });
            }
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    const handleGoToRegister = () => {
        dispatch(clearError());
        navigate('/users/register');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Login</h2>

                {error && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <button type="button" className="text-blue-500 hover:text-blue-700 underline" onClick={handleGoToRegister}>
                                Register
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserLogin; 