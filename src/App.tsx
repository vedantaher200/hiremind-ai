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

import { UserRole } from './types';

const MainAppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<UserRole>('candidate');
  const [selectedCandidateId, setSelectedCandidateId] =
    useState<string>('cand-rahul-01');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  ];

  const recruiterOnlyPages = [
    'recruiter-dashboard',
    'candidates-list',
    'candidates',
    'candidate-details',
    'smart-ranking',
    'jobs-management',
    'jobs',
    'analytics',
    'reports',
    'resume-screening',
    'recruiter-profile',
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-sm font-semibold text-[#3525CD]">
        Loading your secure session…
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
  if (currentPage === 'auth') {
    return (
      <AuthPage
        initialMode={authMode}
        initialRole={authRole}
        onSuccess={() => {
          if (authRole === 'admin') {
            setCurrentPage('admin-dashboard');
          } else if (authRole === 'recruiter') {
            setCurrentPage('recruiter-dashboard');
          } else {
            setCurrentPage('dashboard');
          }
        }}
        onBackToLanding={() => setCurrentPage('landing')}
      />
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <AuthPage
        initialMode="login"
        initialRole="candidate"
        onSuccess={() => {
          if (user?.role === 'admin') {
            setCurrentPage('admin-dashboard');
          } else if (user?.role === 'recruiter') {
            setCurrentPage('recruiter-dashboard');
          } else {
            setCurrentPage('dashboard');
          }
        }}
        onBackToLanding={() => setCurrentPage('landing')}
      />
    );
  }

  // Prevent candidates from accessing recruiter pages
  if (
    user?.role === 'candidate' &&
    recruiterOnlyPages.includes(currentPage)
  ) {
    return (
      <CandidateDashboard onNavigate={handleNavigate} />
    );
  }

  // Prevent recruiters/admins from accessing candidate pages
  if (
    (user?.role === 'recruiter' || user?.role === 'admin') &&
    candidateOnlyPages.includes(currentPage)
  ) {
    return (
      <RecruiterDashboard onNavigate={handleNavigate} />
    );
  }

  const renderCurrentView = () => {
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
        return <CandidateDashboard onNavigate={handleNavigate} />;
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