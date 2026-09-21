import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  CheckCircle, 
  RefreshCw, 
  Award, 
  Check, 
  X, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  ChevronDown, 
  BookOpen,
  Zap
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext.jsx';

export default function TestsAndQuizzes() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'qanda'
  const [qanda, setQanda] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive Quiz States
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(0);

  const fetchTestData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Trigger the sync controller to compile ChapterContent to Qandquiz
      const syncRes = await axios.post('/api/qandq/all', { userId: user?._id });
      
      const data = syncRes.data?.data || syncRes.data;
      setQanda(data.qanda || []);
      setQuiz(data.quiz || []);
    } catch (err) {
      console.error('Failed to sync/fetch test data:', err);
      setError(err.response?.data?.message || 'Failed to load test and quiz data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTestData();
    }
  }, [user]);

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (submitted) return; // Prevent selection changes after submission
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: String(optionIndex),
    });
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === String(q.correctAnswer)) {
        score++;
      }
    });
    return score;
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center transform-gpu">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 shadow-xl">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-20 blur" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-100">Compiling Workspace Materials</h3>
          <p className="text-xs text-slate-400 font-medium">Preparing your customized test & quiz environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans text-slate-100 selection:bg-emerald-400 selection:text-slate-950">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[11px] font-semibold tracking-wide">
            <Zap className="w-3 h-3 fill-cyan-400 text-cyan-400" />
            Evaluation Engine
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Tests & Quizzes
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review accumulated study material or challenge yourself with interactive exams.
          </p>
        </div>

        <button
          onClick={fetchTestData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 text-xs font-bold text-slate-200 shadow-md transition-all duration-200 active:scale-95 self-start md:self-auto transform-gpu"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" /> 
          <span>Sync Latest Data</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/60 text-rose-200 flex items-center justify-between gap-3 text-xs shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button 
            onClick={fetchTestData} 
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl transform-gpu">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all duration-200 transform-gpu ${
            activeTab === 'quiz'
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          onClick={() => setActiveTab('quiz')}
        >
          <CheckCircle className="w-4 h-4" /> 
          <span>Exam Quiz ({quiz.length})</span>
        </button>

        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all duration-200 transform-gpu ${
            activeTab === 'qanda'
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
          onClick={() => setActiveTab('qanda')}
        >
          <HelpCircle className="w-4 h-4" /> 
          <span>Questions & Answers ({qanda.length})</span>
        </button>
      </div>

      {/* TAB 1: PRACTICE EXAM QUIZZES */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          {quiz.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-4 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-200">No Quizzes Available</h3>
              <p className="text-xs text-slate-500 mt-1">Upload book content to generate interactive practice quizzes.</p>
            </motion.div>
          ) : (
            <>
              {/* Score Banner (Post Submission) */}
              <AnimatePresence>
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: -15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    className="p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transform-gpu"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                        <Award className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-white">Exam Completed!</h3>
                        <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                          You scored {calculateScore()} out of {quiz.length} (
                          {Math.round((calculateScore() / quiz.length) * 100)}%)
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={resetQuiz} 
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold transition-all active:scale-95 transform-gpu"
                    >
                      <RotateCcw className="w-4 h-4" /> 
                      <span>Retake Test</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quiz Questions List */}
              <div className="space-y-6">
                {quiz.map((q, qIdx) => {
                  const selectedOpt = selectedAnswers[qIdx];
                  const isCorrect = selectedOpt === String(q.correctAnswer);

                  return (
                    <motion.div 
                      key={qIdx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: qIdx * 0.05 }}
                      className="relative rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 shadow-xl overflow-hidden backdrop-blur-md transform-gpu"
                    >
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <h3 className="font-bold text-base sm:text-lg text-slate-100 leading-snug">
                          <span className="text-cyan-400 font-black mr-2">#{qIdx + 1}</span> 
                          {q.question}
                        </h3>
                        {submitted && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shrink-0 ${
                            isCorrect 
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}>
                            {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options?.map((optionText, optIdx) => {
                          const optStr = String(optIdx);
                          const isSelected = selectedOpt === optStr;
                          const isAnswerKey = String(q.correctAnswer) === optStr;

                          let btnStyle = 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900';

                          if (submitted) {
                            if (isAnswerKey) {
                              btnStyle = 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'border-rose-500/50 bg-rose-950/40 text-rose-200 font-bold';
                            }
                          } else if (isSelected) {
                            btnStyle = 'border-cyan-500/60 bg-cyan-500/10 text-cyan-200 font-bold shadow-md shadow-cyan-500/10';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={submitted}
                              onClick={() => handleSelectOption(qIdx, optIdx)}
                              className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm transition-all duration-200 flex items-center justify-between gap-3 transform-gpu active:scale-[0.99] ${btnStyle}`}
                            >
                              <span className="leading-relaxed">{optionText}</span>
                              {isSelected && !submitted && (
                                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 shrink-0" />
                              )}
                              {submitted && isAnswerKey && (
                                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Submit Quiz Controls */}
              {!submitted && (
                <div className="flex justify-end border-t border-slate-800 pt-6">
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={Object.keys(selectedAnswers).length === 0}
                    className="inline-flex items-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transform-gpu"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Exam</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: QUESTIONS & ANSWERS STUDY SHEET */}
      {activeTab === 'qanda' && (
        <div className="space-y-4">
          {qanda.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-4 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-200">No Questions & Answers Available</h3>
              <p className="text-xs text-slate-500 mt-1">Upload book content to populate study Q&As.</p>
            </motion.div>
          ) : (
            qanda.map((item, idx) => {
              const isOpen = openAccordion === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg backdrop-blur-md transform-gpu"
                >
                  <button
                    onClick={() => setOpenAccordion(isOpen ? null : idx)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-100 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black shrink-0">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{item.question}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
                          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 font-normal selection:bg-cyan-500 selection:text-slate-950">
                            {item.answer}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}