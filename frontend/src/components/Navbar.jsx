import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { clearUserState, setCurrentUser } from '../redux/slices/userSlice';
import defaultAvatar from '/images/default-avatar.svg';
import logo from '../assets/logo.png';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { currentUser } = useSelector((state) => state.user);
    const { isAuthenticated, loading } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch current user data if authenticated but no user data
        const fetchCurrentUser = async () => {
            if (isAuthenticated && !currentUser) {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://your-backend-domain.com/api/v1'}/users/current-user`, {
                        credentials: 'include',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const userData = await response.json();
                        dispatch(setCurrentUser(userData.data));
                    }
                } catch (err) {
                    console.error('App: Auth check failed or timed out:', err);
                    // Only treat as fatal if not benign error
                    if (
                        err !== 'Auth check already in progress' &&
                        !(err instanceof Error && err.message === 'Auth check already in progress')
                    ) {
                        dispatch(logout());
                        localStorage.removeItem('token');
                    }
                }
            }
        };
        
        fetchCurrentUser();
    }, [isAuthenticated, currentUser, dispatch]);

    const handleLogout = () => {
        // Clear user state immediately for better UI response
        dispatch(clearUserState());
        
        // Dispatch logout action but don't wait for it
        dispatch(logout());
        
        // Navigate immediately
        navigate('/users/login');
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <img
                                className="h-12 w-auto"
                                src={logo}
                                alt="Streamio"
                            />
                        </Link>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/videos/upload"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Upload
                                </Link>
                                <Link
                                    to="/tweets"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Tweets
                                </Link>
                                <Link
                                    to="/dashboard"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Dashboard
                                </Link>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                                    >
                                        <img
                                            className="h-8 w-8 rounded-full"
                                            src={currentUser?.avatar || defaultAvatar}
                                            alt={currentUser?.username || 'User'}
                                            onError={(e) => {
                                                e.target.src = defaultAvatar;
                                            }}
                                        />
                                        <span className="text-sm font-medium">
                                            {currentUser?.username || 'User'}
                                        </span>
                                    </button>

                                    {isMenuOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                            <div
                                                className="py-1"
                                                role="menu"
                                                aria-orientation="vertical"
                                                aria-labelledby="user-menu"
                                            >
                                                <Link
                                                    to="/users/account"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    role="menuitem"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    Your Account
                                                </Link>
                                                <Link
                                                    to="/dashboard/watch-history"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    role="menuitem"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    Watch History
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        handleLogout();
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    role="menuitem"
                                                >
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/users/login"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/users/register"
                                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            <svg
                                className={`${
                                    isMenuOpen ? 'hidden' : 'block'
                                } h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            <svg
                                className={`${
                                    isMenuOpen ? 'block' : 'hidden'
                                } h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
                <div className="pt-2 pb-3 space-y-1">
                    <Link
                        to="/"
                        className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        to="/tweets"
                        className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Tweets
                    </Link>
                    
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/videos/upload"
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Upload
                            </Link>
                            <Link
                                to="/dashboard"
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/users/account"
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Your Account
                            </Link>
                            <Link
                                to="/dashboard/watch-history"
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Watch History
                            </Link>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMenuOpen(false);
                                }}
                                className="block w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/users/login"
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/users/register"
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 