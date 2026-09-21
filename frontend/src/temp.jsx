import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, RefreshCw, Layers, Plus } from 'lucide-react';
import PdfUploaderModal from './PdfUploaderModal.jsx'; 
import ChapterContent from '../../backend/src/models/ChapterContent.js';// Import the child component

const UserBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/book/userbooks', {
        withCredentials: true,
      });
      setBooks(response.data.books || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const [selectedBookId, setSelectedBookId] = useState(null);

  // If a book is selected, render the ChapterReader view instead
  if (selectedBookId) {
    return <ChapterReader bookId={selectedBookId} onBack={() => setSelectedBookId(null)} />;
  }
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  };

  return (
    <div className="min-h-screen bg-base-200/50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-3 tracking-tight">
              <BookOpen className="w-10 h-10 text-primary animate-bounce" />
              Mimotute Library
            </h1>
            <p className="text-base-content/70 mt-1">
              Explore your uploaded books and AI-generated study guides with super efficiency.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn btn-primary gap-2 shadow-md hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Upload Book
            </button>

            <button
              onClick={fetchBooks}
              disabled={loading}
              className="btn btn-primary btn-outline gap-2 shadow-md hover:scale-105 transition-transform"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="alert alert-error shadow-lg my-6">
            <span>{error}</span>
            <button onClick={fetchBooks} className="btn btn-sm btn-ghost">Retry</button>
          </div>
        )}

        {/* Skeleton Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-xl border border-base-300/50 animate-pulse">
                <div className="h-48 bg-base-300 rounded-t-2xl"></div>
                <div className="card-body gap-3">
                  <div className="h-6 bg-base-300 rounded w-3/4"></div>
                  <div className="h-4 bg-base-300 rounded w-1/2"></div>
                  <div className="h-10 bg-base-300 rounded mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {books.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-base-100 rounded-3xl shadow-xl border border-dashed border-base-300"
              >
                <Layers className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                <h3 className="text-2xl font-bold">No books found</h3>
                <p className="text-base-content/60 mt-2">Upload a PDF to generate your first interactive chapter study guide.</p>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn btn-primary gap-2 mt-6"
                >
                  <Plus className="w-4 h-4" /> Upload Book Now
                </button>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {books.map((book) => (
                  <motion.div
                    key={book._id}
                    variants={cardVariants}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-200 overflow-hidden group"
                  >
                    <figure className="relative h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center p-6 overflow-hidden">
                      {book.cover ? (
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-center group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="w-16 h-16 text-primary mx-auto mb-2 opacity-80" />
                          <span className="badge badge-neutral text-xs font-mono">PDF DOCUMENT</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="badge badge-primary gap-1 shadow-md">
                          <Sparkles className="w-3 h-3" /> Ready
                        </span>
                      </div>
                    </figure>

                    <div className="card-body p-5">
                      <h2 className="card-title text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                        {book.title}
                      </h2>

                      <p className="text-xs text-base-content/60 mt-1">
                        Uploaded: {new Date(book.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>

                      <div className="card-actions justify-end mt-4">
                        <button 
      onClick={() => setSelectedBookId(book._id)}
      className="btn btn-primary btn-block gap-2 shadow-sm group-hover:shadow-primary/30 transition-shadow"
    >
      Study Chapters
    </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Animated Uploader Modal */}
        <PdfUploaderModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => fetchBooks()}
        />
      </div>
    </div>
  );
};

export default UserBooks;