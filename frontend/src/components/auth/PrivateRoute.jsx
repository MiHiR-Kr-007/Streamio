import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser } from '../../redux/slices/authSlice';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const location = useLocation();
    const [authChecked, setAuthChecked] = useState(false);
    
    useEffect(() => {
        let timeoutId;
        
        if (authChecked) return;
        
        if ((!isAuthenticated || !user) && !loading) {
            console.log('PrivateRoute: Authentication or user data missing, checking with server');
            
            timeoutId = setTimeout(() => {
                console.log('PrivateRoute: Auth check timed out');
                setAuthChecked(true);
            }, 5000);
            
            
            dispatch(getCurrentUser())
                .finally(() => {
                    console.log('PrivateRoute: Auth check completed');
                    setAuthChecked(true);
                    clearTimeout(timeoutId);
                });
        } else {
            console.log('PrivateRoute: User is authenticated or check already done');
            setAuthChecked(true);
        }
        
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isAuthenticated, loading, user, authChecked, dispatch]);

    
    if ((loading || (!isAuthenticated && !authChecked))) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
                <p className="text-gray-700">Verifying authentication...</p>
                {isAuthenticated && !user && (
                    <p className="text-sm text-gray-500 mt-2">Loading user data...</p>
                )}
            </div>
        );
    }

    
    return (isAuthenticated && user) ? (
        children
    ) : (
        <Navigate 
            to="/users/login" 
            state={{ from: location.pathname }}
            replace 
        />
    );
};

export default PrivateRoute; 