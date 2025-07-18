import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register } from '../../redux/slices/authSlice';
import { clearError } from '../../redux/slices/authSlice';

const UserRegister = () => {
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        avatar: null,
        coverImage: null,
        avatarPreview: null,
        coverImagePreview: null
    });
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        // Redirect if user is already authenticated
        if (isAuthenticated) {
            navigate('/');
        }
        // Clear any lingering auth error on mount
        dispatch(clearError());
    }, [isAuthenticated, navigate, dispatch]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            const file = files[0];
            // Create preview URL for images
            if (file && file.type.startsWith('image/')) {
                const previewUrl = URL.createObjectURL(file);
                setFormData({
                    ...formData,
                    [name]: file,
                    [`${name}Preview`]: previewUrl
                });
            } else {
                setFormData({
                    ...formData,
                    [name]: file
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        
        // Only append non-null values
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && !key.includes('Preview')) {
                formDataToSend.append(key, formData[key]);
            }
        });
        
        try {
            const resultAction = await dispatch(register(formDataToSend)).unwrap();
            if (resultAction) {
                navigate('/users/login');
            }
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Register</h2>
                
                {error && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Avatar</label>
                        <input
                            type="file"
                            name="avatar"
                            accept="image/*"
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                            required
                        />
                        {formData.avatarPreview && (
                            <div className="mt-2">
                                <img 
                                    src={formData.avatarPreview} 
                                    alt="Avatar preview" 
                                    className="w-20 h-20 object-cover rounded-full border border-gray-300"
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                        <input
                            type="file"
                            name="coverImage"
                            accept="image/*"
                            onChange={handleChange}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                        />
                        {formData.coverImagePreview && (
                            <div className="mt-2">
                                <img 
                                    src={formData.coverImagePreview} 
                                    alt="Cover image preview" 
                                    className="w-full h-32 object-cover rounded-md border border-gray-300"
                                />
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <a href="/users/login" className="text-blue-500 hover:text-blue-700">
                                Login
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserRegister; 