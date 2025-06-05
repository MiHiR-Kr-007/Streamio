import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localFilePath) => {
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })

        // console.log("File uploaded in cloudinary :: response :: ", response);
        fs.unlinkSync(localFilePath)
        return response;
    }
    catch (error) {
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath); 
            }
        } catch (unlinkErr) {
            console.error("Failed to clean up local file:", unlinkErr);
        }

        console.error("Problem in uploading file to Cloudinary:", error);
        return null;
    }
}

export default uploadOnCloudinary;