import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, BookOpen, AlertCircle, RefreshCw, Zap } from 'lucide-react';

export default function AuthForm() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fixed backend field key to 'fullname' instead of 'fullName'
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Ensure payload sends 'fullname' expected by backend auth controller
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { fullname: formData.fullname, email: formData.email, password: formData.password };

    try {
      if (isLogin) {
        await login(payload);
      } else {
        await register(payload);
      }

      // Redirect immediately after successful login/signup
      navigate('/dashboard/books');
    } catch (err) {
      console.error("Login Error Details:", err.response?.data || err.message);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.response?.data?.error || 'An error occurred. Check server logs.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full relative flex flex-col justify-between bg-[#0b0f17] text-slate-100 font-sans px-4 py-6 sm:p-8 overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 transform-gpu">
      
      {/* ================= AMBIENT MOBILE BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transform-gpu">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-transparent blur-[80px]" />
        <div className="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-600/20 via-sky-800/15 to-transparent blur-[90px]" />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* ================= MOBILE HEADER ================= */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-md mx-auto pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Sparkles className="h-5 w-5 text-cyan-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-wider text-white flex items-center gap-1.5 leading-none">
              MIMOTUTE
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                AI
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">Mobile Learning Suite</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-semibold tracking-wide">
          <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" />
          v2.5
        </div>
      </header>

      {/* ================= MAIN FORM CONTAINER ================= */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto py-4">
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80 overflow-hidden transform-gpu"
        >
          {/* Top Segmented Controller (Tab Switcher) */}
          <div className="flex p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-6 transform-gpu">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setMessage({ type: '', text: '' });
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 transform-gpu ${
                isLogin
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setMessage({ type: '', text: '' });
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 transform-gpu ${
                !isLogin
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Header */}
          <div className="space-y-1 mb-6 text-left">
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {isLogin ? 'Welcome Back' : 'Get Started'}
              <BookOpen className="w-5 h-5 text-cyan-400 inline-block" />
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isLogin
                ? 'Access your saved book summaries and active recall quizzes.'
                : 'Turn books into intelligent summaries and practice tests.'}
            </p>
          </div>

          {/* Alert Message Box */}
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/60 text-rose-200 flex items-center gap-2.5 text-xs mb-5 shadow-lg overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-medium leading-tight">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input (Only on Sign Up) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider pl-1">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      placeholder="Alex Mercer"
                      autoComplete="name"
                      autoCapitalize="words"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@domain.com"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-11 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200 active:scale-90 transition-transform"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/25 transition-all active:scale-[0.97] hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none mt-6 flex items-center justify-center gap-2 transform-gpu"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  {isLogin ? <ArrowRight className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>

          {/* Dynamic Bottom Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              {isLogin ? "Don't have an account?" : 'Already registered?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage({ type: '', text: '' });
                }}
                className="ml-1.5 font-bold text-cyan-300 hover:text-cyan-200 underline underline-offset-4 active:scale-95 inline-block transition-transform"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* ================= MOBILE FOOTER ================= */}
      <footer className="relative z-10 py-2 text-center text-[11px] text-slate-500">
        &copy; {new Date().getFullYear()} Mimotute AI. Engineered for Mobile Learning.
      </footer>
    </div>
  );
}