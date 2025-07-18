import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Dashboard from './Dashboard';

const UserDashboard = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/users/login', { state: { from: '/dashboard' } });
        }
    }, [isAuthenticated, navigate]);

    return <Dashboard />;
};

export default UserDashboard; 