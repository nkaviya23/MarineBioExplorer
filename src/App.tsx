import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ExplorePage } from './pages/ExplorePage.tsx';
import { OrganismDetailPage } from './pages/OrganismDetailPage.tsx';
import { IdentifyPage } from './pages/IdentifyPage.tsx';
import { ContributePage } from './pages/ContributePage.tsx';
import { UnknownsPage } from './pages/UnknownsPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { AdminLoginPage } from './pages/AdminLoginPage.tsx';
import { ContributorDashboard } from './pages/ContributorDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedOrganismId, setSelectedOrganismId] = useState<string>('');

  // Handle URL hash changes for easy deep-linking and browser navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash.startsWith('organism/')) {
        const id = hash.replace('organism/', '');
        setSelectedOrganismId(id);
        setCurrentView('organism-detail');
      } else if (hash) {
        setCurrentView(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (view: string, id?: string) => {
    if (view === 'organism-detail' && id) {
      setSelectedOrganismId(id);
      window.location.hash = `organism/${id}`;
    } else {
      window.location.hash = view === 'home' ? '' : view;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route protection for dashboards
  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-slate-500 text-sm">
          Loading Marine Bio Explorer...
        </div>
      );
    }

    switch (currentView) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'explore':
        return <ExplorePage onNavigate={handleNavigate} />;
      case 'organism-detail':
        return <OrganismDetailPage organismId={selectedOrganismId} onNavigate={handleNavigate} />;
      case 'identify':
        return <IdentifyPage onNavigate={handleNavigate} />;
      case 'contribute':
        return <ContributePage onNavigate={handleNavigate} />;
      case 'unknowns':
        return <UnknownsPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} />;
      case 'contributor-dashboard':
        if (!user) return <LoginPage onNavigate={handleNavigate} />;
        return <ContributorDashboard onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        if (!user || user.role !== 'ADMIN') {
          return <AdminLoginPage onNavigate={handleNavigate} />;
        }
        return <AdminDashboard onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-1 flex flex-col">
        {renderContent()}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
