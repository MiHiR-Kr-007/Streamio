import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './redux/slices/authSlice';
import './App.css';
import Navbar from './components/Navbar';
import UserRegister from './components/user/UserRegister';
import UserLogin from './components/user/UserLogin';
import UserLogout from './components/user/UserLogout';
import UserProfile from './components/user/UserProfile';
import UserAccount from './components/user/UserAccount';
import UserTweet from './components/user/UserTweet';
import UserVideoUpload from './components/user/UserVideoUpload';
import UserTweets from './components/tweet/UserTweets';
import VideoUpload from './components/video/VideoUpload';
import VideoList from './components/video/VideoList';
import VideoDetail from './components/video/VideoDetail';
import TweetList from './components/tweet/TweetList';
import TweetCreate from './components/tweet/TweetCreate';
import PlaylistList from './components/playlist/PlaylistList';
import PlaylistDetail from './components/playlist/PlaylistDetail';
import Dashboard from './components/dashboard/Dashboard';
import WatchHistory from './components/dashboard/WatchHistory';
import PrivateRoute from './components/auth/PrivateRoute';
import VideoEdit from './components/video/VideoEdit';

const App = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const [authChecked, setAuthChecked] = useState(false);
    const [authCheckFailed, setAuthCheckFailed] = useState(false);
    const [authCheckInProgress, setAuthCheckInProgress] = useState(false);

    useEffect(() => {
        if (authChecked || authCheckInProgress) return;
        setAuthCheckInProgress(true);
        const checkAuth = async () => {
            console.log('App: Checking authentication status');
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    console.log('App: Token found, verifying with server');
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => {
                            console.log('App: Auth check timed out');
                            reject(new Error('Auth check timed out'));
                        }, 5000);
                    });
                    await Promise.race([
                        dispatch(getCurrentUser()).unwrap(),
                        timeoutPromise
                    ]);
                    console.log('App: Auth check completed successfully');
                } catch (err) {
                    console.error('App: Auth check failed or timed out:', err);
                    setAuthCheckFailed(true);
                    localStorage.removeItem('token');
                }
            } else {
                console.log('App: No token found');
            }
            setAuthChecked(true);
            setAuthCheckInProgress(false);
        };
        checkAuth();
    }, [dispatch, authChecked, authCheckInProgress]);

    const retryAuth = () => {
        console.log('App: Retrying authentication');
        setAuthChecked(false);
        setAuthCheckFailed(false);
        setAuthCheckInProgress(false);
    };

    // Show minimal loading state if needed
    if (!authChecked && localStorage.getItem('token')) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
                <p className="text-gray-600">Checking authentication status...</p>
            </div>
        );
    }

    // Show error state if auth check failed
    if (authCheckFailed) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md text-center">
                    <p className="font-bold">Authentication Error</p>
                    <p className="text-sm">We couldn't verify your authentication status.</p>
                    <button 
                        onClick={retryAuth}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Check if authenticated but user data is missing
    const userDataMissing = isAuthenticated && !user && authChecked;
    
    if (userDataMissing) {
        console.log('App: User is authenticated but user data is missing, fetching user data');
        // Try to fetch user data again
        dispatch(getCurrentUser());
        
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
                <p className="text-gray-600">Loading user data...</p>
            </div>
        );
    }

    return (
        <Router>
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <Routes>
                        {/* Home Route */}
                        <Route path="/" element={<Navigate to="/videos" replace />} />
                        
                        {/* Public Routes */}
                        <Route path="/users/register" element={
                            isAuthenticated ? <Navigate to="/" /> : <UserRegister />
                        } />
                        <Route path="/users/login" element={
                            isAuthenticated ? <Navigate to="/" /> : <UserLogin />
                        } />
                        <Route path="/users/logout" element={<UserLogout />} />
                        
                        {/* Protected Routes - all video and tweet related routes require authentication */}
                        <Route path="/videos" element={
                            <PrivateRoute>
                                <VideoList />
                            </PrivateRoute>
                        } />
                        <Route path="/videos/:videoId" element={
                            <PrivateRoute>
                                <VideoDetail />
                            </PrivateRoute>
                        } />
                        <Route path="/tweets" element={
                            <PrivateRoute>
                                <TweetList />
                            </PrivateRoute>
                        } />
                        <Route path="/tweets/user" element={
                            <PrivateRoute>
                                <UserTweets />
                            </PrivateRoute>
                        } />

                        {/* Protected Routes - specific routes first, then dynamic routes */}
                        <Route path="/dashboard" element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/users/dashboard" element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/users/account" element={
                            <PrivateRoute>
                                <UserAccount />
                            </PrivateRoute>
                        } />
                        <Route path="/users/tweet" element={
                            <PrivateRoute>
                                <UserTweet />
                            </PrivateRoute>
                        } />
                        <Route path="/users/video-upload" element={
                            <PrivateRoute>
                                <UserVideoUpload />
                            </PrivateRoute>
                        } />
                        {/* Dynamic routes after specific routes */}
                        <Route path="/users/:userId" element={<UserProfile />} />
                        <Route path="/videos/upload" element={
                            <PrivateRoute>
                                <VideoUpload />
                            </PrivateRoute>
                        } />
                        <Route path="/tweets/create" element={
                            <PrivateRoute>
                                <TweetCreate />
                            </PrivateRoute>
                        } />
                        <Route path="/playlists" element={
                            <PrivateRoute>
                                <PlaylistList />
                            </PrivateRoute>
                        } />
                        <Route path="/playlists/:playlistId" element={
                            <PrivateRoute>
                                <PlaylistDetail />
                            </PrivateRoute>
                        } />
                        <Route path="/dashboard/watch-history" element={
                            <PrivateRoute>
                                <WatchHistory />
                            </PrivateRoute>
                        } />
                        <Route path="/videos/edit/:videoId" element={
                            <PrivateRoute>
                                <VideoEdit />
                            </PrivateRoute>
                        } />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
