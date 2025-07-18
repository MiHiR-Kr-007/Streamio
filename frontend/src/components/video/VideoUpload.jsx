import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadVideo, setLoading, setError } from '../../redux/slices/videoSlice';

const VideoUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoFile: null,
    thumbnail: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileErrors, setFileErrors] = useState({
    videoFile: '',
    thumbnail: ''
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.video);
  const { isAuthenticated } = useSelector(state => state.auth);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/users/login', { state: { from: '/videos/upload' } });
    }
  }, [isAuthenticated, navigate]);

  const validateFile = (file, type) => {
    if (!file) return "File is required";
    
    // Validate file size
    const maxSize = type === 'video' ? 100 * 1024 * 1024 : 5 * 1024 * 1024; // 100MB for video, 5MB for image
    if (file.size > maxSize) {
      return `File size exceeds the limit (${type === 'video' ? '100MB' : '5MB'})`;
    }
    
    // Validate file type
    const validTypes = type === 'video' 
      ? ['video/mp4', 'video/webm', 'video/ogg']
      : ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      
    if (!validTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${validTypes.join(', ')}`;
    }
    
    return '';
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      const file = files[0];
      
      // Validate file if it's a video or thumbnail
      if (name === 'videoFile' || name === 'thumbnail') {
        const fileType = name === 'videoFile' ? 'video' : 'image';
        const error = validateFile(file, fileType);
        
        setFileErrors(prev => ({
          ...prev,
          [name]: error
        }));
      }
      
      setFormData({
        ...formData,
        [name]: file
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const videoError = validateFile(formData.videoFile, 'video');
    const thumbnailError = validateFile(formData.thumbnail, 'image');
    
    setFileErrors({
      videoFile: videoError,
      thumbnail: thumbnailError
    });
    
    // If there are errors, don't proceed
    if (videoError || thumbnailError) {
      return;
    }
    
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    dispatch(setLoading(true));
    dispatch(setError(null));
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);
    
    try {
      await dispatch(uploadVideo(formDataToSend)).unwrap();
      
      // Reset form after successful upload
      setFormData({
        title: '',
        description: '',
        videoFile: null,
        thumbnail: null
      });
      
      // Reset file inputs
      document.getElementById('videoFileInput').value = '';
      document.getElementById('thumbnailInput').value = '';
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Show success message
      alert('Video uploaded successfully!');
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      clearInterval(progressInterval);
      setUploadProgress(0);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  // Do not show any video list or 'no videos found' error here

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Video File (Max 100MB)</label>
          <input
            id="videoFileInput"
            type="file"
            name="videoFile"
            onChange={handleChange}
            accept="video/mp4,video/webm,video/ogg"
            className="mt-1 block w-full"
            required
          />
          {fileErrors.videoFile && (
            <p className="mt-1 text-sm text-red-600">{fileErrors.videoFile}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Supported formats: MP4, WebM, OGG</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Thumbnail (Max 5MB)</label>
          <input
            id="thumbnailInput"
            type="file"
            name="thumbnail"
            onChange={handleChange}
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="mt-1 block w-full"
            required
          />
          {fileErrors.thumbnail && (
            <p className="mt-1 text-sm text-red-600">{fileErrors.thumbnail}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Supported formats: JPEG, PNG, WebP</p>
        </div>
        
        {uploadProgress > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : 'Upload complete!'}
            </p>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          disabled={loading || fileErrors.videoFile || fileErrors.thumbnail}
        >
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
};

export default VideoUpload; 