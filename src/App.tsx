import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { HelpCenterPage } from './pages/HelpCenterPage';

// Candidate Pages
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { ResumeIntelligencePage } from './pages/candidate/ResumeIntelligencePage';
import { AIInterviewPage } from './pages/candidate/AIInterviewPage';
import { TestsPage } from './pages/candidate/TestsPage';
import { ResultsPage } from './pages/candidate/ResultsPage';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';
import { JobsPage } from './pages/candidate/JobsPage';
import { InternshipBoardPage } from './pages/candidate/InternshipBoardPage';

// Recruiter Pages
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { CandidatesListPage } from './pages/recruiter/CandidatesListPage';
import { CandidateDetailsPage } from './pages/recruiter/CandidateDetailsPage';
import { SmartRankingPage } from './pages/recruiter/SmartRankingPage';
import { JobsManagementPage } from './pages/recruiter/JobsManagementPage';
import { InternshipPostingsPage } from './pages/recruiter/InternshipPostingsPage';
import { AnalyticsPage } from './pages/recruiter/AnalyticsPage';
import { ResumeScreeningPage } from './pages/recruiter/ResumeScreeningPage';
import { RecruiterProfilePage } from './pages/recruiter/RecruiterProfilePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminCandidatesPage } from './pages/admin/AdminCandidatesPage';
import { AdminJobsPage } from './pages/admin/AdminJobsPage';
import { AdminInternshipsPage } from './pages/admin/AdminInternshipsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

import { UserRole, UserProfile } from './types';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<UserRole>('candidate');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasMounted = React.useRef(false);

  const handleAuthSuccess = (authenticatedUser?: UserProfile) => {
    const targetRole = authenticatedUser?.role || user?.role;
    if (targetRole === 'admin') {
      setCurrentPage('admin-dashboard');
    } else if (targetRole === 'recruiter') {
      setCurrentPage('recruiter-dashboard');
    } else if (targetRole === 'candidate') {
      setCurrentPage('dashboard');
    } else {
      console.warn('Unknown authenticated role in handleAuthSuccess:', targetRole);
      setCurrentPage('auth');
    }
  };

  // Auto-route on session restore after refresh
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (!hasMounted.current) {
        hasMounted.current = true;
        if (currentPage === 'landing' || currentPage === 'auth') {
          if (user.role === 'admin') {
            setCurrentPage('admin-dashboard');
          } else if (user.role === 'recruiter') {
            setCurrentPage('recruiter-dashboard');
          } else if (user.role === 'candidate') {
            setCurrentPage('dashboard');
          }
        }
      }
    }
  }, [isLoading, isAuthenticated, user, currentPage]);

  const handleNavigate = (page: string, candidateId?: string) => {
    if (candidateId) {
      setSelectedCandidateId(candidateId);
    }

    setCurrentPage(page);
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleStartAuth = (
    mode: 'login' | 'register',
    role: UserRole = 'candidate'
  ) => {
    setAuthMode(mode);
    setAuthRole(role);
    setCurrentPage('auth');
  };

  const candidateOnlyPages = [
    'candidate-dashboard',
    'dashboard',
    'resume-intelligence',
    'ai-interview',
    'tests',
    'results',
    'candidate-profile',
    'profile',
    'opportunities',
    'internships'
  ];

  const recruiterOnlyPages = [
    'recruiter-dashboard',
    'candidates-list',
    'candidates',
    'candidate-details',
    'smart-ranking',
    'jobs-management',
    'jobs',
    'internships-management',
    'analytics',
    'reports',
    'resume-screening',
    'recruiter-profile',
  ];

  const adminOnlyPages = [
    'admin-dashboard',
    'admin-candidates',
    'admin-jobs',
    'admin-internships',
    'admin-analytics',
    'admin-profile'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center text-sm font-semibold text-[#3525CD] gap-3">
        <div className="w-8 h-8 border-3 border-[#3525CD] border-t-transparent rounded-full animate-spin"></div>
        <span>Restoring your authenticated session…</span>
      </div>
    );
  }

  // Public landing page
  if (currentPage === 'landing' && !isAuthenticated) {
    return (
      <LandingPage
        onNavigate={handleNavigate}
        onLoginClick={(role) =>
          handleStartAuth('login', role || 'candidate')
        }
        onRegisterClick={(role) =>
          handleStartAuth('register', role || 'candidate')
        }
      />
    );
  }

  // Authentication page
  if (currentPage === 'auth' || !isAuthenticated) {
    return (
      <AuthPage
        initialMode={authMode}
        initialRole={authRole}
        onSuccess={handleAuthSuccess}
        onBackToLanding={() => setCurrentPage('landing')}
        onRoleChange={(newRole) => setAuthRole(newRole)}
        onModeChange={(newMode) => setAuthMode(newMode)}
      />
    );
  }

  const renderCurrentView = () => {
    // Cross-role page access guards
    if (user?.role === 'candidate' && (recruiterOnlyPages.includes(currentPage) || adminOnlyPages.includes(currentPage))) {
      return <CandidateDashboard onNavigate={handleNavigate} />;
    }
    if (user?.role === 'recruiter' && (candidateOnlyPages.includes(currentPage) || adminOnlyPages.includes(currentPage))) {
      return <RecruiterDashboard onNavigate={handleNavigate} />;
    }
    if (user?.role === 'admin') {
      if (candidateOnlyPages.includes(currentPage)) {
        return <AdminDashboardPage />;
      }
      if (currentPage === 'candidates-list' || currentPage === 'candidates') {
        return <AdminCandidatesPage onNavigate={handleNavigate} />;
      }
      if (currentPage === 'jobs-management' || currentPage === 'jobs') {
        return <AdminJobsPage />;
      }
      if (currentPage === 'internships-management') {
        return <AdminInternshipsPage />;
      }
      if (currentPage === 'analytics') {
        return <AdminAnalyticsPage />;
      }
      if (recruiterOnlyPages.includes(currentPage)) {
        return <AdminDashboardPage />;
      }
    }

    switch (currentPage) {
      // =========================
      // Candidate Views
      // =========================
      case 'candidate-dashboard':
      case 'dashboard':
        return (
          <CandidateDashboard onNavigate={handleNavigate} />
        );

      case 'resume-intelligence':
        return <ResumeIntelligencePage />;

      case 'ai-interview':
        return (
          <AIInterviewPage onNavigate={handleNavigate} />
        );

      case 'tests':
        return <TestsPage onNavigate={handleNavigate} />;

      case 'results':
        return <ResultsPage onNavigate={handleNavigate} />;

      case 'candidate-profile':
      case 'profile':
        return (
          <CandidateProfilePage onNavigate={handleNavigate} />
        );

      case 'opportunities':
        return <JobsPage />;

      case 'internships':
        return <InternshipBoardPage />;

      // =========================
      // Shared Views
      // =========================
      case 'help':
        return <HelpCenterPage />;

      // =========================
      // Admin Views
      // =========================
      case 'admin-dashboard':
        return <AdminDashboardPage />;

      case 'admin-candidates':
        return <AdminCandidatesPage onNavigate={handleNavigate} />;

      case 'admin-jobs':
        return <AdminJobsPage />;

      case 'admin-internships':
        return <AdminInternshipsPage />;

      case 'admin-analytics':
        return <AdminAnalyticsPage />;

      case 'admin-profile':
        return <AdminProfilePage onNavigate={handleNavigate} />;

      // =========================
      // Recruiter Views
      // =========================
      case 'recruiter-dashboard':
        return (
          <RecruiterDashboard onNavigate={handleNavigate} />
        );

      case 'candidates-list':
      case 'candidates':
        return (
          <CandidatesListPage onNavigate={handleNavigate} />
        );

      case 'candidate-details':
        return (
          <CandidateDetailsPage
            candidateId={selectedCandidateId}
            onNavigate={handleNavigate}
          />
        );

      case 'smart-ranking':
        return (
          <SmartRankingPage onNavigate={handleNavigate} />
        );

      case 'jobs-management':
      case 'jobs':
        return (
          <JobsManagementPage onNavigate={handleNavigate} />
        );

      case 'internships-management':
        return (
          <InternshipPostingsPage />
        );

      case 'resume-screening':
        return (
          <ResumeScreeningPage onNavigate={handleNavigate} />
        );

      case 'recruiter-profile':
        return (
          <RecruiterProfilePage onNavigate={handleNavigate} />
        );

      case 'analytics':
      case 'reports':
        return <AnalyticsPage />;

      default:
        if (user?.role === 'admin') {
          return <AdminDashboardPage />;
        }
        if (user?.role === 'recruiter') {
          return <RecruiterDashboard onNavigate={handleNavigate} />;
        }
        if (user?.role === 'candidate') {
          return <CandidateDashboard onNavigate={handleNavigate} />;
        }
        return (
          <div className="p-8 text-center text-slate-600">
            <p className="font-semibold">Unable to resolve authorized dashboard for this role.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#191C1D] antialiased">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          onNavigate={handleNavigate}
          onToggleSidebar={() =>
            setMobileMenuOpen((current) => !current)
          }
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto pb-16">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}