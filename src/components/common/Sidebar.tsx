import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Video,
  CheckSquare,
  Award,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  HelpCircle,
  LogOut,
  Sparkles,
  Briefcase,
  Search,
  Bot,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  type LucideIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  count?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen = false,
  onClose
}) => {
  const { user, role, logout } = useAuth();

  const candidateNavItems: NavigationItem[] = [
    {
      id: 'candidate-dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'resume-intelligence',
      label: 'Resume Intelligence',
      icon: FileText,
      badge: 'AI'
    },
    {
      id: 'opportunities',
      label: 'Find Opportunities',
      icon: Search
    },
    {
      id: 'internships',
      label: 'Internships',
      icon: GraduationCap,
      badge: 'New'
    },
    {
      id: 'ai-interview',
      label: 'AI Interview',
      icon: Video,
      badge: 'Live'
    },
    {
      id: 'tests',
      label: 'Evaluation Tests',
      icon: CheckSquare
    },
    {
      id: 'results',
      label: 'My Results',
      icon: Award
    },
    {
      id: 'candidate-profile',
      label: 'My Profile',
      icon: Users
    }
  ];

  const recruiterNavItems: NavigationItem[] = [
    {
      id: 'recruiter-dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'candidates-list',
      label: 'Candidates',
      icon: Users
    },
    {
      id: 'candidate-details',
      label: 'Candidate Assessment',
      icon: Award
    },
    {
      id: 'smart-ranking',
      label: 'Smart Ranking',
      icon: TrendingUp,
      badge: 'Auto'
    },
    {
      id: 'jobs-management',
      label: 'Job Postings',
      icon: Briefcase
    },
    {
      id: 'internships-management',
      label: 'Internships',
      icon: GraduationCap,
      badge: 'Active'
    },
    {
      id: 'resume-screening',
      label: 'Resume Screening',
      icon: FileText,
      badge: 'AI'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileSpreadsheet
    },
    {
      id: 'recruiter-profile',
      label: 'My Profile',
      icon: UserCheck
    }
  ];

  const adminNavItems: NavigationItem[] = [
    {
      id: 'admin-dashboard',
      label: 'Admin Verification',
      icon: ShieldCheck
    },
    {
      id: 'candidates-list',
      label: 'Candidates',
      icon: Users
    },
    {
      id: 'jobs-management',
      label: 'Platform Jobs',
      icon: Briefcase
    },
    {
      id: 'internships-management',
      label: 'Platform Internships',
      icon: GraduationCap
    },
    {
      id: 'analytics',
      label: 'Platform Analytics',
      icon: BarChart3
    }
  ];

  const navItems: NavigationItem[] =
    role === 'admin'
      ? adminNavItems
      : role === 'recruiter'
      ? recruiterNavItems
      : candidateNavItems;

  const handleNav = (id: string) => {
    onNavigate(id);
    onClose?.();
  };

  const handleLogout = () => {
    void logout().catch((error) => {
      console.error('Logout failed:', error);
    });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-white
          border-r border-[#E5E7EB]
          flex flex-col justify-between
          transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${
            isOpen
              ? 'translate-x-0 shadow-2xl'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
        <div>
          {/* Brand Logo */}
          <div className="h-16 px-6 flex items-center border-b border-[#E5E7EB]">
            <button
              type="button"
              onClick={() =>
                handleNav(
                  role === 'candidate'
                    ? 'candidate-dashboard'
                    : 'recruiter-dashboard'
                )
              }
              className="flex items-center gap-2.5 cursor-pointer group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0F766E] flex items-center justify-center shadow-sm shadow-teal-900/15 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5 text-white" />
              </div>

              <div>
                <span className="font-extrabold text-lg text-[#191C1D] tracking-tight flex items-center gap-1">
                  HireMind
                  <span className="text-[#0F766E] font-black text-xs px-1.5 py-0.5 rounded-md bg-[#E6F4F1] border border-[#B9DFD8]">
                    AI
                  </span>
                </span>

                <span className="text-[10px] text-[#737380] font-medium block -mt-1 tracking-wider uppercase">
                  Recruitment OS
                </span>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2">
              <span className="text-[11px] font-semibold text-[#8E8EA0] uppercase tracking-wider">
                {role === 'candidate'
                  ? 'Candidate Portal'
                  : 'Recruiter Workspace'}
              </span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`
                    w-full flex items-center justify-between
                    px-3.5 py-2.5 rounded-xl text-sm
                    font-medium transition-all group
                    ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#3525CD] font-semibold shadow-sm'
                        : 'text-[#464555] hover:bg-[#F8F9FA] hover:text-[#191C1D]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`
                        w-4 h-4 transition-colors
                        ${
                          isActive
                            ? 'text-[#3525CD]'
                            : 'text-[#737380] group-hover:text-[#191C1D]'
                        }
                      `}
                    />

                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#0F766E] text-white font-semibold shadow-sm">
                      {item.badge}
                    </span>
                  )}

                  {item.count && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-[#464555] font-medium">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[#E5E7EB] space-y-1">
          <button
            type="button"
            onClick={() => handleNav('landing')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#464555] hover:bg-[#F8F9FA] hover:text-[#191C1D] transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#712AE2]" />
            <span>Platform Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('help')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#464555] hover:bg-[#F8F9FA] hover:text-[#191C1D] transition-all"
          >
            <HelpCircle className="w-4 h-4 text-[#737380]" />
            <span>Help Center</span>
          </button>

          {/* User Profile Card */}
          <div className="mt-2 p-2.5 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={user?.name || 'User'}
                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-indigo-200"
              />

              <div className="truncate">
                <p className="text-xs font-semibold text-[#191C1D] truncate">
                  {user?.name || 'User'}
                </p>

                <p className="text-[10px] text-[#737380] truncate">
                  {user?.email || 'No email available'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="p-1.5 text-[#737380] hover:text-red-600 rounded-lg hover:bg-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};