import React, { useState, useEffect, useCallback } from 'react';
import { User } from './types';
import * as api from './services/mockService';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import Layout from './components/Layout';
import { AuthContext } from './contexts';
import { DEMO_BOARDS, DEMO_TASKS, DEMO_USER } from './demoData';

const DEMO_BANNER_DELAY_MS = 45 * 1000; // 45 seconds

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [currentView, setCurrentView] = useState('login');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [loginInitialMode, setLoginInitialMode] = useState<'LOGIN_PASS' | 'REGISTER'>('LOGIN_PASS');

  const [demoBoards, setDemoBoards] = useState<typeof DEMO_BOARDS>(() => [...DEMO_BOARDS]);
  const [demoTasks, setDemoTasks] = useState<Record<string, typeof DEMO_TASKS[string]>>(() => ({ ...DEMO_TASKS }));
  const [showRegisterBanner, setShowRegisterBanner] = useState(false);

  const resetDemo = useCallback(() => {
    setDemoBoards([...DEMO_BOARDS]);
    setDemoTasks({ ...DEMO_TASKS });
  }, []);

  const loginAsDemo = useCallback(() => {
    setUser(DEMO_USER);
    setIsDemo(true);
    setShowRegisterBanner(false);
    resetDemo();
    setCurrentView('dashboard');
  }, [resetDemo]);

  useEffect(() => {
    if (isDemo) return;
    const checkAuth = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setCurrentView('dashboard');
        }
      } catch (error) {
        console.error("Auth check failed", error);
        api.logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [isDemo]);

  useEffect(() => {
    if (!isDemo || !user) return;
    const t = setTimeout(() => setShowRegisterBanner(true), DEMO_BANNER_DELAY_MS);
    return () => clearTimeout(t);
  }, [isDemo, user]);

  const handleLogin = async (email: string) => {
    const loggedInUser = await api.getCurrentUser();
    if (loggedInUser) {
      setUser(loggedInUser);
      setIsDemo(false);
      setCurrentView('dashboard');
    }
  };

  const handleLogout = async () => {
    if (!isDemo) await api.logout();
    setUser(null);
    setIsDemo(false);
    setShowRegisterBanner(false);
    setCurrentView('login');
  };

  const openRegisterFromBanner = () => {
    setUser(null);
    setIsDemo(false);
    setShowRegisterBanner(false);
    setLoginInitialMode('REGISTER');
    setCurrentView('login');
  };

  const navigateTo = (view: string, param?: string) => {
    if (view === 'board' && param) {
      setActiveBoardId(param);
      setCurrentView('board');
    } else {
      setActiveBoardId(null);
      setCurrentView(view);
    }
  };

  if (loading && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-mono text-ink tracking-widest text-sm uppercase">Loading Folio...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login: handleLogin,
        logout: handleLogout,
        loginAsDemo,
        isLoading: loading,
        isDemo,
        demoBoards,
        demoTasks,
        setDemoBoards,
        setDemoTasks,
        resetDemo,
        showRegisterBanner,
        setShowRegisterBanner,
      }}
    >
      {user ? (
        <Layout onNavigate={navigateTo} activePage={activeBoardId ? 'board' : 'dashboard'} onOpenRegisterFromBanner={openRegisterFromBanner}>
          {currentView === 'dashboard' && <Dashboard onOpenBoard={(id) => navigateTo('board', id)} />}
          {currentView === 'board' && activeBoardId && (
            <BoardView boardId={activeBoardId} onBack={() => navigateTo('dashboard')} />
          )}
        </Layout>
      ) : (
        <Login onLogin={handleLogin} initialMode={loginInitialMode} onModeUsed={() => setLoginInitialMode('LOGIN_PASS')} />
      )}
    </AuthContext.Provider>
  );
};

export default App;