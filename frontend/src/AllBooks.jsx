import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, RefreshCw, Layers, Plus, Check, Zap, AlertCircle, Compass, BookMarked } from 'lucide-react';
import PdfUploaderModal from './PdfUploaderModal.jsx'; 
import ChapterContent from '../../backend/src/models/ChapterContent.js';

const Allbooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [addingBookId, setAddingBookId] = useState(null);
  const [addedBookIds, setAddedBookIds] = useState([]);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/book/books', {
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

  // Handle adding a book to user's library
  const handleAddToLibrary = async (bookId) => {
    setAddingBookId(bookId);
    try {
      await axios.post('/api/book/addtolib', { bookId }, { withCredentials: true });
      setAddedBookIds((prev) => [...prev, bookId]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add book to library.');
    } finally {
      setAddingBookId(null);
    }
  };

  if (selectedBookId) {
    return <ChapterContent bookId={selectedBookId} onBack={() => setSelectedBookId(null)} />;
  }

  // Framer Motion Animation Variants (Optimized transitions)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.05
      } 
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' } 
    },
  };

  return (
    <div className="relative min-h-screen bg-[#0b0f17] text-slate-100 p-4 sm:p-6 md:p-12 overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans transform-gpu">
      
      {/* Optimized Static Ambient Background Layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transform-gpu">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-[90px]" />
        <div className="absolute top-1/3 -right-40 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-cyan-600/15 via-sky-800/10 to-transparent blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl overflow-hidden transform-gpu">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Public Directory</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/20">
                <BookOpen className="w-8 h-8" />
              </div>
              Mimotute Library
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              Explore your uploaded books and AI-generated study guides with super efficiency.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden transform-gpu"
            >
              <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              <span>Upload Book</span>
            </button>

            <button
              onClick={fetchBooks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-700/80 bg-slate-800/80 text-slate-300 font-semibold text-sm backdrop-blur-md transition-all duration-200 hover:bg-slate-700/60 hover:text-white hover:border-slate-500 active:scale-95 disabled:opacity-50 transform-gpu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Dynamic Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between p-4 rounded-2xl border border-rose-500/30 bg-rose-950/60 text-rose-200 backdrop-blur-md shadow-lg transform-gpu"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button 
                onClick={fetchBooks} 
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-100 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loader vs Books View */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4 animate-pulse backdrop-blur-md">
                <div className="h-48 bg-slate-800/60 rounded-2xl" />
                <div className="h-5 bg-slate-800/60 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-800/60 rounded-lg w-1/2" />
                <div className="h-11 bg-slate-800/60 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {books.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 px-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl space-y-6 max-w-2xl mx-auto transform-gpu"
              >
                <div className="relative inline-flex p-5 rounded-3xl bg-slate-800/80 border border-slate-700 shadow-inner">
                  <Compass className="w-12 h-12 text-teal-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">No books found</h3>
                  <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                    Upload a PDF to generate your first interactive chapter study guide.
                  </p>
                </div>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 transition-all hover:scale-105 active:scale-95 transform-gpu"
                >
                  <Plus className="w-4 h-4" /> Upload Book Now
                </button>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transform-gpu"
              >
                {books.map((book) => {
                  const isAdded = addedBookIds.includes(book._id);
                  const isProcessing = addingBookId === book._id;

                  return (
                    <motion.div
                      key={book._id}
                      variants={cardVariants}
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-cyan-500/40 hover:shadow-[0_15px_30px_-10px_rgba(6,182,212,0.25)] flex flex-col justify-between transform-gpu will-change-transform"
                    >
                      <div>
                        {/* Card Cover Area */}
                        <figure className="relative h-52 bg-slate-950 flex items-center justify-center p-4 overflow-hidden border-b border-slate-800/60">
                          {book.cover ? (
                            <img
                              src={book.cover}
                              alt={book.title}
                              loading="lazy"
                              className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300 transform-gpu"
                            />
                          ) : (
                            <div className="text-center group-hover:scale-105 transition-transform duration-300 space-y-3 transform-gpu">
                              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 inline-block shadow-inner">
                                <BookMarked className="w-10 h-10 text-teal-400" />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 uppercase">
                                  PDF Document
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="absolute top-3 right-3 z-10">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-emerald-400 shadow-md">
                              <Sparkles className="w-3 h-3 text-amber-400" /> Ready
                            </span>
                          </div>
                        </figure>

                        {/* Book Metadata */}
                        <div className="p-5 space-y-2">
                          <h2 className="text-base font-extrabold text-slate-100 line-clamp-2 group-hover:text-cyan-300 transition-colors leading-snug">
                            {book.title}
                          </h2>

                          <p className="text-xs text-slate-400 font-medium">
                            Uploaded: {new Date(book.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Add to Library Button */}
                      <div className="p-5 pt-0 z-10">
                        <button 
                          onClick={() => handleAddToLibrary(book._id)}
                          disabled={isProcessing || isAdded}
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 shadow-lg active:scale-95 transform-gpu ${
                            isAdded
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 group-hover:bg-gradient-to-r group-hover:from-emerald-400 group-hover:via-teal-400 group-hover:to-cyan-400 group-hover:text-slate-950 group-hover:border-transparent group-hover:shadow-cyan-500/20'
                          }`}
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                          ) : isAdded ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" /> 
                              <span>Added to Library</span>
                            </>
                          ) : (
                            'Add to library'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <PdfUploaderModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => fetchBooks()}
        />
      </div>
    </div>
  );
};

export default Allbooks;