import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: 'djzzn3e49',
  api_key: '747563936613422',
  api_secret: 'j97a0t2a4wH5E8CpHT4JwArAOeE',
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: 'profile_pics',
    });

    // Remove local temporary file after successful upload
    fs.unlinkSync(localFilePath);
    return response.secure_url;
  } catch (error) {
    // Clean up local temporary file on failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error('Cloudinary upload error:', error);
    return null;
  }
};