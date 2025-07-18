import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import defaultThumbnail from '/images/default-thumbnail.svg';

const PlaylistList = ({ userId }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylist, setNewPlaylist] = useState({
        name: '',
        description: ''
    });
    const [debugInfo, setDebugInfo] = useState({
        fetchStarted: false,
        fetchCompleted: false,
        errors: []
    });

    useEffect(() => {
        const fetchPlaylists = async () => {
            console.log('PlaylistList: Starting playlist fetch', { userId });
            setDebugInfo(prev => ({ ...prev, fetchStarted: true }));

            try {
                const token = localStorage.getItem('token');
                console.log('PlaylistList: Token available:', !!token);

                const endpoint = userId
                    ? API_ENDPOINTS.USER_PLAYLISTS(userId)
                    : API_ENDPOINTS.PLAYLISTS;
                console.log('PlaylistList: Using endpoint:', endpoint);

                // Create an AbortController to handle timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.log('PlaylistList: Request timed out');
                    controller.abort();
                }, 10000); // 10 second timeout

                console.log('PlaylistList: Making API call');
                const response = await axios.get(endpoint, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log('PlaylistList: API call succeeded', {
                    status: response.status,
                    dataLength: response.data?.data?.length || 0
                });

                if (response.data && response.data.data) {
                    setPlaylists(response.data.data);
                }
                setDebugInfo(prev => ({ ...prev, fetchCompleted: true }));
                setLoading(false);
            } catch (err) {
                console.error('PlaylistList: Failed to fetch playlists:', err);
                setDebugInfo(prev => ({
                    ...prev,
                    errors: [...prev.errors, {
                        message: err.message,
                        name: err.name,
                        code: err.code,
                        status: err.response?.status,
                        statusText: err.response?.statusText
                    }]
                }));

                if (err.name === 'AbortError') {
                    setError('Request timed out. Please try again later.');
                } else {
                    setError(err.response?.data?.message || 'Failed to fetch playlists');
                }
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, [userId]);

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        if (!newPlaylist.name.trim() || !newPlaylist.description.trim()) return;

        try {
            setLoading(true);
            console.log('PlaylistList: Creating new playlist');

            const token = localStorage.getItem('token');
            console.log('PlaylistList: Token available for creation:', !!token);

            // Create an AbortController to handle timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('PlaylistList: Creation request timed out');
                controller.abort();
            }, 10000); // 10 second timeout

            const response = await axios.post(API_ENDPOINTS.PLAYLISTS, newPlaylist, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('PlaylistList: Playlist creation succeeded');

            if (response.data && response.data.data) {
                setPlaylists([...playlists, response.data.data]);
            }
            setNewPlaylist({ name: '', description: '' });
            setIsCreating(false);
        } catch (err) {
            console.error('PlaylistList: Failed to create playlist:', err);
            setDebugInfo(prev => ({
                ...prev,
                errors: [...prev.errors, {
                    type: 'creation',
                    message: err.message,
                    name: err.name,
                    code: err.code,
                    status: err.response?.status,
                    statusText: err.response?.statusText
                }]
            }));

            if (err.name === 'AbortError') {
                setError('Request timed out. Please try again later.');
            } else {
                setError(err.response?.data?.message || 'Failed to create playlist');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlaylist = async (playlistId) => {
        if (!window.confirm("Are you sure you want to delete this playlist?")) {
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            await axios.delete(`${API_ENDPOINTS.PLAYLISTS}/${playlistId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Update UI by removing deleted playlist
            setPlaylists(playlists.filter(playlist => playlist._id !== playlistId));
            setLoading(false);
        } catch (err) {
            console.error('Failed to delete playlist:', err);
            setError(err.response?.data?.message || 'Failed to delete playlist');
            setLoading(false);
        }
    };

    if (loading && playlists.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
                <div className="text-sm text-gray-600">
                    <p>Loading playlists...</p>
                    <p className="mt-2">Debug info:</p>
                    <ul className="list-disc pl-5 mt-1">
                        <li>Fetch started: {debugInfo.fetchStarted ? 'Yes' : 'No'}</li>
                        <li>Fetch completed: {debugInfo.fetchCompleted ? 'Yes' : 'No'}</li>
                        <li>Errors: {debugInfo.errors.length}</li>
                    </ul>
                    {debugInfo.errors.length > 0 && (
                        <div className="mt-2 text-red-500">
                            <p>Last error: {debugInfo.errors[debugInfo.errors.length - 1].message}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Create Playlist
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                            {debugInfo.errors.length > 0 && (
                                <button
                                    className="text-xs text-red-600 mt-1 underline"
                                    onClick={() => console.log('Debug errors:', debugInfo.errors)}
                                >
                                    Show debug info in console
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isCreating && (
                <form onSubmit={handleCreatePlaylist} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Playlist Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={newPlaylist.name}
                            onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                            placeholder="Enter playlist name"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={newPlaylist.description}
                            onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                            placeholder="Enter playlist description"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            rows="3"
                            required
                        ></textarea>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={loading || !newPlaylist.name.trim() || !newPlaylist.description.trim()}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                        >
                            {loading ? 'Creating...' : 'Create Playlist'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {playlists.length === 0 ? (
                <div className="text-center py-12">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No playlists yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Create a playlist to organize your favorite videos
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {playlists.map((playlist) => {
                        // Ensure playlist has a valid _id
                        const playlistId = playlist?._id || `temp-${Math.random()}`;

                        return (
                            <div key={playlist._id} className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <Link
                                            to={`/playlists/${playlist._id}`}
                                            className="text-lg font-medium text-gray-900 hover:text-red-600"
                                        >
                                            {playlist.name}
                                        </Link>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleDeletePlaylist(playlist._id)}
                                                className="text-gray-400 hover:text-red-600"
                                                title="Delete playlist"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{playlist.description}</p>
                                    <p className="text-xs text-gray-400">{playlist.videos?.length || 0} videos</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PlaylistList;