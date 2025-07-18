import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import { clearUserState } from '../../redux/slices/userSlice';

const UserLogout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(clearUserState());
        
        dispatch(logout());
        
        navigate('/users/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
        >
            Logout
        </button>
    );
};

export default UserLogout; 