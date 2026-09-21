import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  Zap, 
  ArrowRight, 
  BookMarked, 
  AlertCircle, 
  Compass, 
  Clock, 
  CheckCircle2, 
  Search 
} from 'lucide-react';
import PdfUploaderModal from './PdfUploaderModal.jsx'; 
import ChapterReader from './ChapterReader.jsx';

const UserBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/book/userbooks', {
        withCredentials: true,
      });
      setBooks(response.data?.books || response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  if (selectedBookId) {
    return <ChapterReader bookId={selectedBookId} onBack={() => setSelectedBookId(null)} />;
  }

  const filteredBooks = books.filter(book => 
    book.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.06 } 
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.25, ease: 'easeOut' } 
    },
  };

  return (
    <div className="relative min-h-screen bg-[#090d14] text-slate-100 p-4 sm:p-6 md:p-10 font-sans antialiased">
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* ================= HERO HEADER CARD ================= */}
        <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-xl">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
              <span>AI Learning Hub</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                My Knowledge Library
              </span>
            </h1>
            
            <p className="text-slate-400 text-sm sm:text-base font-normal leading-relaxed">
              Access your uploaded documents, study structured AI chapters, and launch customized quizzes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>

            <button
              onClick={fetchBooks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 text-slate-300 font-semibold text-sm hover:bg-slate-700 hover:text-white transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Books"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* ================= STATS & SEARCH BAR ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Quick Metrics */}
          <div className="flex items-center gap-6 w-full sm:w-auto px-4 py-3 rounded-2xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-slate-400">Total Books:</span>
              <span className="text-sm font-bold text-white">{books.length}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Status:</span>
              <span className="text-sm font-bold text-emerald-400">Ready</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-200 placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Dynamic Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-200"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button 
                onClick={fetchBooks} 
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= CONTENT GRID ================= */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 animate-pulse">
                <div className="h-44 bg-slate-800/50 rounded-2xl" />
                <div className="h-5 bg-slate-800/50 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-800/50 rounded-lg w-1/2" />
                <div className="h-10 bg-slate-800/50 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl border border-slate-800/80 bg-slate-900/40 space-y-5 max-w-xl mx-auto">
            <div className="inline-flex p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <Compass className="w-10 h-10 text-teal-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">No books found</h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                {searchQuery ? "No results matching your query." : "Upload a PDF document to begin generating structured AI chapter guides."}
              </p>
            </div>
            {!searchQuery && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-400 text-slate-950 font-bold text-xs shadow-md hover:bg-teal-300 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Upload First Book
              </button>
            )}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredBooks.map((book) => (
              <motion.div
                key={book._id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/90 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg"
              >
                <div>
                  {/* Card Cover Header */}
                  <div className="relative h-48 bg-slate-950/80 flex items-center justify-center p-4 border-b border-slate-800/60">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 inline-block">
                          <BookMarked className="w-8 h-8 text-teal-400" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-teal-400/10 text-teal-300 border border-teal-400/20 uppercase">
                            PDF
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-emerald-400">
                        <Sparkles className="w-3 h-3 text-teal-400" /> Processed
                      </span>
                    </div>
                  </div>

                  {/* Book Title & Date */}
                  <div className="p-5 space-y-2">
                    <h2 className="text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-teal-300 transition-colors leading-snug">
                      {book.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(book.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </div>

                {/* Chapter Action Button */}
                <div className="p-5 pt-0">
                  <button 
                    onClick={() => setSelectedBookId(book._id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-teal-400 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all duration-200 active:scale-95"
                  >
                    <span>Study Chapters</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
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

export default UserBooks;