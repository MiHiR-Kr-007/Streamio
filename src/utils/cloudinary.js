import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteLocalFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (err) {
        // silent fail
    }
};

const uploadOnCloudinary = async (localFilePath, options = {}) => {
    if (!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            format: 'webp',
            quality: 'auto',
            ...options
        });
        deleteLocalFile(localFilePath);
        return response;
    } catch (err) {
        deleteLocalFile(localFilePath);
        return null;
    }
};

const uploadThumbnailOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'image',
            format: 'webp',
            transformation: [
                { width: 320, height: 180, crop: 'fill', quality: 'auto' }
            ]
        });
        deleteLocalFile(localFilePath);
        return response;
    } catch (err) {
        deleteLocalFile(localFilePath);
        return null;
    }
};

const uploadAvatarOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'image',
            format: 'webp',
            transformation: [
                { width: 150, height: 150, crop: 'fill', quality: 'auto' }
            ]
        });
        deleteLocalFile(localFilePath);
        return response;
    } catch (err) {
        deleteLocalFile(localFilePath);
        return null;
    }
};

const uploadCoverImageOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'image',
            format: 'webp',
            transformation: [
                { width: 1200, height: 300, crop: 'fill', quality: 'auto' }
            ]
        });
        deleteLocalFile(localFilePath);
        return response;
    } catch (err) {
        deleteLocalFile(localFilePath);
        return null;
    }
};

export {
    uploadOnCloudinary,
    uploadThumbnailOnCloudinary,
    uploadAvatarOnCloudinary,
    uploadCoverImageOnCloudinary
};

export default uploadOnCloudinary;
