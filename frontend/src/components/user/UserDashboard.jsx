import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError } from '../../redux/slices/userSlice';
import axios from 'axios';

const UserDashboard = () => {
    const dispatch = useDispatch();
    const { user, loading, error } = useSelector((state) => state.user);

    useEffect(() => {
        const fetchUser = async () => {
            dispatch(setLoading(true));
            try {
                const response = await axios.get('/api/users/profile');
                dispatch(setUser(response.data));
                dispatch(setError(null));
            } catch (error) {
                dispatch(setError(error.response.data.message));
            } finally {
                dispatch(setLoading(false));
            }
        };
        fetchUser();
    }, [dispatch]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!user) return <div>No user found</div>;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">User Dashboard</h2>
                <div className="space-y-4">
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Full Name:</strong> {user.full_name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default UserDashboard; 