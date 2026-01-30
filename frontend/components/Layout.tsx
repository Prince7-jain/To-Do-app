import React from 'react';
import { LogOut, Grid, X } from 'lucide-react';
import { useAuth } from '../contexts';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
  activePage: string;
  onOpenRegisterFromBanner?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate, activePage, onOpenRegisterFromBanner }) => {
  const { user, logout, isDemo, showRegisterBanner, setShowRegisterBanner } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col md:flex-row overflow-hidden font-serif selection:bg-mustard/40 transition-colors duration-300">
      {/* Sidebar / Navigation - Looks like a book spine or divider */}
      <aside className="w-full md:w-64 bg-[#E6E2D6] border-b md:border-b-0 md:border-r border-[#D1CEC4] flex flex-col relative z-20 shadow-[4px_0_10px_rgba(0,0,0,0.05)] transition-colors duration-300">
        <div className="p-8 pb-4">
          <h1 className="text-4xl font-bold tracking-tight text-terracotta rotate-[-1deg] mb-1">Folio.</h1>
          <p className="font-hand text-lg text-pencil-gray -mt-2 ml-10 opacity-80">imperfectly yours</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full text-left px-6 py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300 flex items-center gap-3 group
              ${activePage === 'dashboard' 
                ? 'bg-white shadow-[2px_3px_0px_rgba(0,0,0,0.1)] border border-stone-200 -rotate-1 translate-x-2' 
                : 'hover:bg-white/50 hover:translate-x-1'}`}
          >
            <Grid className={`w-4 h-4 ${activePage === 'dashboard' ? 'text-terracotta' : 'text-pencil-gray'}`} />
            My Boards
            {activePage === 'dashboard' && <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />}
          </button>
        </nav>

        <div className="p-6 border-t border-[#D1CEC4] bg-[#DFDBD0]/50">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center text-white font-serif italic border-2 border-[#E6E2D6] shadow-sm">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-ink">{user?.name}</p>
              <p className="text-xs text-pencil-gray truncate font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-4">
            <button 
                onClick={logout}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-terracotta hover:text-red-700 hover:underline decoration-wavy underline-offset-4 transition-all"
            >
                <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
        
        {/* Visual texture */}
        <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-l from-black/5 to-transparent pointer-events-none"></div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative perspective-1000">
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none fixed"></div>
        {isDemo && showRegisterBanner && onOpenRegisterFromBanner && (
          <div className="sticky top-0 z-30 bg-terracotta/95 text-white px-4 py-3 flex items-center justify-between gap-4 shadow-md animate-in slide-in-from-top duration-300">
            <p className="font-mono text-sm md:text-base">
              Create an account to save your tasks permanently.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenRegisterFromBanner}
                className="px-4 py-2 bg-white text-terracotta font-mono text-xs font-bold uppercase tracking-widest rounded hover:bg-paper"
              >
                Register
              </button>
              <button
                onClick={() => setShowRegisterBanner(false)}
                className="p-2 text-white/80 hover:text-white"
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto p-4 md:p-12 min-h-full">
           {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;