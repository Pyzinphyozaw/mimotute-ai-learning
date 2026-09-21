import User from '../models/User.js';
import { uploadOnCloudinary } from '../lib/cloudinary.js';
import Book from '../models/Book.js';

export const updateProfilePic = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    // 1. Upload local file path to Cloudinary
    const avatarUrl = await uploadOnCloudinary(req.file.path);

    if (!avatarUrl) {
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary.' });
    }

    // 2. Save Cloudinary URL into User model
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: avatarUrl },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      message: 'Profile picture updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile pic error:', error);
    return res.status(500).json({ message: 'Server error updating profile picture.' });
  }
};



export const getUserProfileDetails = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Run queries concurrently for optimal performance
    const [userData, userBooks] = await Promise.all([
      User.findById(userId).select('fullname profilePic email createdAt').lean(),
      Book.find({ userId }).select('title cover workspace createdAt').lean()
    ]);

    if (!userData) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      profile: {
        fullname: userData.fullname,
        profilePic: userData.profilePic,
        email: userData.email,
        memberSince: userData.createdAt,
        totalBooks: userBooks.length,
        books: userBooks
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Server error fetching profile details.' });
  }
};