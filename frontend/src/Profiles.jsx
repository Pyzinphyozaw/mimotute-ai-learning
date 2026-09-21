import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, User as UserIcon, Mail, Calendar, Sparkles, Library, Layers, Camera, X } from 'lucide-react';
import { useAuth } from './contexts/AuthContext.jsx';
import ProfilePictureUpload from './ProfilePictureUpload.jsx'; // Make sure the path matches your project structure

export default function Profiles() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/profile/details');
      setProfileData(res.data.profile);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.message || 'Could not load profile information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Callback to refresh profile image after upload completes
  const handleUploadSuccess = (updatedUser) => {
    if (updatedUser?.profilePic) {
      setProfileData((prev) => ({ ...prev, profilePic: updatedUser.profilePic }));
    } else {
      fetchProfile();
    }
    setShowUploadModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-medium text-base-content/60">Loading your profile showcase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-lg mx-auto mt-8 shadow-lg">
        <span>{error}</span>
      </div>
    );
  }

  const { fullname, profilePic, email, memberSince, totalBooks, books } = profileData || {};

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/15 via-base-100 to-accent/15 border border-base-300 p-8 md:p-10 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
          
          {/* Clickable Profile Avatar with Hover Overlay */}
          <div 
            onClick={() => setShowUploadModal(true)}
            className="group relative cursor-pointer"
            title="Click to update profile picture"
          >
            <div className="avatar">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full ring-4 ring-primary/40 ring-offset-base-100 ring-offset-4 shadow-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
                {profilePic ? (
                  <img src={profilePic} alt={fullname} className="object-cover w-full h-full" />
                ) : (
                  <div className="bg-primary/20 w-full h-full flex items-center justify-center text-primary font-black text-4xl">
                    {fullname?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            {/* Hover Overlay Badge */}
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-xs font-semibold gap-1 p-2 text-center">
              <Camera className="w-5 h-5" />
              <span>Update Picture</span>
            </div>
          </div>

          {/* User Details */}
          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> MimoTute Member
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-base-content tracking-tight">{fullname}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs md:text-sm text-base-content/70">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-primary" /> {email}
              </span>
              {memberSince && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" /> Joined {new Date(memberSince).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat bg-base-100 border border-base-200 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
          <div className="stat-figure text-primary">
            <Library className="w-8 h-8" />
          </div>
          <div className="stat-title text-xs font-semibold uppercase tracking-wider">Total Collection</div>
          <div className="stat-value text-primary">{totalBooks}</div>
          <div className="stat-desc">Books uploaded & indexed</div>
        </div>

        <div className="stat bg-base-100 border border-base-200 rounded-2xl shadow-sm hover:border-accent/50 transition-colors">
          <div className="stat-figure text-accent">
            <Layers className="w-8 h-8" />
          </div>
          <div className="stat-title text-xs font-semibold uppercase tracking-wider">Active Workspace</div>
          <div className="stat-value text-accent">{totalBooks > 0 ? 'Active' : 'Empty'}</div>
          <div className="stat-desc">Ready for quiz generation</div>
        </div>
      </div>

      {/* Book Collection Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-base-300 pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            My Library Books ({totalBooks})
          </h2>
        </div>

        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book, index) => (
              <div
                key={book._id || index}
                className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden"
              >
                <div className="card-body p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base line-clamp-2 leading-snug" title={book.title}>
                        {book.title}
                      </h3>
                      {book.workspace && (
                        <span className="badge badge-sm badge-ghost mt-2 text-xs">
                          {book.workspace}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-base-100 rounded-2xl border border-dashed border-base-300">
            <BookOpen className="w-10 h-10 mx-auto text-base-content/30 mb-2" />
            <p className="text-sm text-base-content/60">No books found in your workspace repository.</p>
          </div>
        )}
      </div>

      {/* Modal for Profile Picture Upload */}
      {showUploadModal && (
        <div className="modal modal-open">
          <div className="modal-box relative max-w-md bg-base-100 rounded-3xl p-6 border border-base-200 shadow-2xl">
            <button
              onClick={() => setShowUploadModal(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" /> Update Profile Picture
            </h3>
            
            <ProfilePictureUpload onSuccess={handleUploadSuccess} />
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setShowUploadModal(false)}></div>
        </div>
      )}
    </div>
  );
}