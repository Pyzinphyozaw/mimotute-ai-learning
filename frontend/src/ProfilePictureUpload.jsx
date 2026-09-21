import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext.jsx'; // Context utility[cite: 11]

export default function ProfilePictureUpload({ onSuccess }) {
  const { user } = useAuth(); //[cite: 11]
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user?.profilePic || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    // Create multipart form payload
    const formData = new FormData();
    formData.append('profilePic', file);
    formData.append('userId', user?._id);

    try {
      const response = await axios.put('/api/profile/changeprofile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = response.data?.user || response.data;

      // Trigger callback to close modal and update Profiles.jsx state
      if (onSuccess) {
        onSuccess(updatedUser);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="flex flex-col items-center space-y-5 py-2">
      {error && (
        <div className="alert alert-error text-xs p-2 rounded-xl w-full">
          <span>{error}</span>
        </div>
      )}

      {/* Image Preview Container */}
      <div className="avatar">
        <div className="w-28 h-28 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden shadow-md">
          <img src={preview || '/default-avatar.png'} alt="Profile Preview" className="object-cover w-full h-full" />
        </div>
      </div>

      {/* File Input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="file-input file-input-bordered file-input-primary w-full text-sm"
      />

      {/* Submit Action */}
      <button
        type="submit"
        disabled={!file || loading}
        className="btn btn-primary btn-block gap-2 rounded-xl"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" /> Save Profile Picture
          </>
        )}
      </button>
    </form>
  );
}