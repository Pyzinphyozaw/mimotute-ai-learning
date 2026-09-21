import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Terminal, 
  Maximize2,
  Sparkles,
  Hourglass,
  Coffee,
  Heart,
  Rocket,
  Zap
} from 'lucide-react';

const WAITING_MESSAGES = [
  { text: "Wait a moment, it will take a few minutes...", icon: Hourglass },
  { text: "Good things take time!", icon: Sparkles },
  { text: "Brewing something special for you...", icon: Coffee },
  { text: "Almost there, putting on the finishing touches...", icon: Rocket },
  { text: "Thanks for your patience!", icon: Heart },
];

export default function PdfUploaderModal({ isOpen, onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [streamLog, setStreamLog] = useState(''); // Stores incoming stream text
  const [showStreamModal, setShowStreamModal] = useState(false); // Controls large stream popup visibility
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through waiting messages when loading is active
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
      }, 4000);
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setStatus({ type: '', message: '' });
    } else if (file) {
      setStatus({ type: 'error', message: 'Only PDF documents are allowed.' });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setStatus({ type: '', message: '' });
    } else {
      setStatus({ type: 'error', message: 'Please drop a valid PDF file.' });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatus({ type: 'error', message: 'Please select a PDF file.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });
    setStreamLog('');
    setShowStreamModal(true); // Open large streaming output popup

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);

    try {
      const controller = new AbortController();

      const response = await fetch('/api/book/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This book already exists in your library.');
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload and index PDF.');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setStatus({ type: 'success', message: 'Book uploaded and structured into chapters!' });
        setTimeout(() => {
          onSuccess(data);
          handleClose();
        }, 1500);
        return;
      }

      // Read SSE Stream chunks
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedResponseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.replace('data: ', '').trim();
              if (jsonStr === '[DONE]') continue;
              const parsed = JSON.parse(jsonStr);
              if (parsed.textResponse) {
                accumulatedResponseText += parsed.textResponse;
                setStreamLog((prev) => prev + parsed.textResponse);
              }
            } catch (err) {
              // Ignore partial JSON breaks
            }
          } else if (line.trim().length > 0) {
            accumulatedResponseText += line;
            setStreamLog((prev) => prev + line + '\n');
          }
        }
      }

      setStatus({ type: 'success', message: 'Book uploaded and structured into chapters!' });
      setTimeout(() => {
        onSuccess({ message: 'Success', details: accumulatedResponseText });
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.name === 'TypeError' && error.message === 'Failed to fetch'
        ? 'Connection lost during deep vector processing. Please verify server proxy configuration.'
        : error.message || 'Failed to upload and index PDF.';
        
      setStatus({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedFile(null);
    setStatus({ type: '', message: '' });
    setStreamLog('');
    setShowStreamModal(false);
    onClose();
  };

  const CurrentWaitingIcon = WAITING_MESSAGES[messageIndex].icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transform-gpu">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/95 text-slate-100 shadow-2xl overflow-hidden p-6 sm:p-8 transform-gpu"
        >
          {/* Top Accent Line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          {/* Main Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-[11px] font-semibold tracking-wide">
                <Zap className="w-3 h-3 fill-teal-400 text-teal-400" />
                Vector Indexing
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Upload New Book
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a PDF to parse chapters, summaries, and quizzes.
              </p>
            </div>
            <button 
              onClick={handleClose} 
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert Status */}
          {status.message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`text-xs p-3.5 mb-5 rounded-2xl border flex items-center gap-2.5 shadow-md ${
                status.type === 'error' 
                  ? 'border-rose-500/30 bg-rose-950/60 text-rose-200' 
                  : 'border-emerald-500/30 bg-emerald-950/60 text-emerald-200'
              }`}
            >
              {status.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span className="font-medium leading-tight">{status.message}</span>
            </motion.div>
          )}

          {/* Form / Drop Zone */}
          <form onSubmit={handleUpload} className="space-y-5">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer transform-gpu ${
                dragActive 
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]' 
                  : 'border-slate-800 bg-slate-950/60 hover:border-cyan-500/40 hover:bg-slate-950/80'
              }`}
            >
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 flex items-center justify-center shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-slate-100 max-w-[250px] truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
                    <UploadCloud className="w-6 h-6 text-teal-400" />
                  </div>
                  <p className="font-semibold text-sm text-slate-200">
                    Drag & drop your PDF here, or <span className="text-cyan-400 font-bold underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Supports PDF format up to 50MB</p>
                </div>
              )}
            </div>

            {/* Live Stream Monitor Button */}
            {loading && (
              <button
                type="button"
                onClick={() => setShowStreamModal(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold transition-all hover:bg-cyan-500/20 active:scale-95 transform-gpu"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>View AI Stream Terminal Monitor</span>
                </div>
                <Maximize2 className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none transform-gpu"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Reading PDF & Generating Study Guide...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> 
                  <span>Start Processing</span>
                </>
              )}
            </button>
          </form>

          {/* STREAMING DISPLAY POPUP MODAL */}
          <AnimatePresence>
            {showStreamModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transform-gpu">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="w-full max-w-3xl h-[85vh] bg-[#0b0f17] text-slate-100 rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden transform-gpu"
                >
                  {/* Stream Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
                    <div className="flex items-center gap-3 text-cyan-400">
                      <Terminal className="w-5 h-5 animate-pulse text-cyan-400" />
                      <h3 className="text-sm font-extrabold tracking-wide uppercase">
                        Live AI Processing & RAG Pipeline
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowStreamModal(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Animated Waiting Banner */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center bg-slate-900/50 p-6 border-b border-slate-800/80">
                      <div className="relative mb-3">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-60 blur animate-pulse" />
                        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 text-teal-400 shadow-inner">
                          <CurrentWaitingIcon className="w-7 h-7 animate-bounce transition-all duration-500" />
                        </div>
                      </div>

                      {/* Dynamic Message */}
                      <div className="h-7 flex items-center justify-center">
                        <p key={messageIndex} className="text-sm font-semibold text-slate-200 transition-all duration-500">
                          "{WAITING_MESSAGES[messageIndex].text}"
                        </p>
                      </div>

                      {/* Progress Bar & Indicators */}
                      <div className="w-full max-w-md space-y-2.5 mt-3">
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                          <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-pulse rounded-full w-full" />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          <span>Embedding vector chunks...</span>
                        </div>
                      </div>

                      {/* Animated Page Dots */}
                      <div className="flex gap-1.5 mt-3">
                        {WAITING_MESSAGES.map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              idx === messageIndex ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Terminal Log Output Area */}
                  <div className="flex-1 p-6 font-mono text-xs overflow-y-auto space-y-2 leading-relaxed bg-slate-950 text-emerald-400 selection:bg-emerald-400 selection:text-slate-950">
                    <p className="whitespace-pre-wrap opacity-90">
                      {streamLog || 'Initializing AI pipeline & workspace indexing...'}
                    </p>
                  </div>

                  {/* Terminal Footer Indicator */}
                  <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Status: Active Pipeline Stream
                    </span>
                    <span className="font-mono text-slate-400 truncate max-w-[200px]">
                      {selectedFile?.name || 'PDF Document'}
                    </span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}