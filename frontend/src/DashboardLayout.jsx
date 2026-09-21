import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import { 
  BookOpen, 
  User, 
  Compass, 
  FileText, 
  LogOut, 
  Sparkles,
  Bot,
  Zap
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Books', path: '/dashboard/books', icon: BookOpen },
    { name: 'Explore', path: '/dashboard/explore', icon: Compass },
    { name: 'AI Work', path: '/dashboard/learn', icon: Bot, isFab: true },
    { name: 'Tests', path: '/dashboard/tests', icon: FileText },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0b0f17] font-sans text-slate-100 antialiased selection:bg-emerald-400 selection:text-slate-950 transform-gpu">
      
      {/* ================= OPTIMIZED AMBIENT BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transform-gpu">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-[90px]" />
        <div className="absolute top-1/3 -right-32 h-[450px] w-[450px] rounded-full bg-gradient-to-br from-cyan-600/15 via-sky-800/10 to-transparent blur-[100px]" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-[90px]" />

        {/* Minimal Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col min-w-0 overflow-hidden">
        
        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 sm:px-8 backdrop-blur-md shadow-lg shadow-slate-950/50 transform-gpu">
          {/* Subtle Accent Top Border */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          {/* Logo & Animated Sparkle */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </div>
            </div>
            <span className="text-lg font-black tracking-wider text-white flex items-center gap-1.5">
              MIMOTUTE 
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                AI
              </span>
            </span>
          </div>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Active
            </div>

            <button 
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 active:scale-95 transition-all hover:bg-rose-500/20 hover:border-rose-500/40 transform-gpu"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <Link 
              to="/dashboard/profile"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 p-[1.5px] active:scale-95 transition-transform shadow-md shadow-teal-500/20 transform-gpu"
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-xs font-extrabold text-cyan-300">
                {user?.name?.[0]?.toUpperCase() || user?.title?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
          </div>
        </header>

        {/* ================= MAIN VIEWPORT ================= */}
        {/* Adjusted padding-bottom to reflect shorter navigation bar height */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
          <Outlet />
        </main>

        {/* ================= BOTTOM NAVIGATION BAR ================= */}
        {/* Reduced background transparency (bg-slate-950/98) & compact padding (py-1) */}
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800/80 bg-slate-950/98 backdrop-blur-xl px-2 py-1 shadow-[0_-8px_20px_rgba(0,0,0,0.7)] transform-gpu">
          <div className="flex items-center justify-around max-w-md mx-auto relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              /* Prominent Floating Action Button (FAB) for AI Central Hub */
              if (item.isFab) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative -top-3.5 flex flex-col items-center group"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 p-0.5 shadow-lg transition-all duration-200 active:scale-95 transform-gpu ${
                      isActive 
                        ? 'ring-2 ring-cyan-400/40 shadow-cyan-400/30 scale-105' 
                        : 'shadow-teal-500/20 group-hover:scale-105'
                    }`}>
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
                        <Icon className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'text-cyan-300 scale-110' : 'text-slate-300 group-hover:text-cyan-300'
                        }`} />
                      </div>
                    </div>
                    <span className={`text-[10px] font-black mt-0.5 tracking-wider transition-colors ${
                      isActive ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                );
              }

              /* Standard Bottom Bar Nav Item */
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex flex-1 flex-col items-center justify-center py-0.5 transition-all duration-200 active:scale-95 transform-gpu ${
                    isActive ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute -top-1 h-0.5 w-5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                  )}

                  <div className="relative">
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? 'scale-110' : ''
                    }`} />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
};

export default DashboardLayout;