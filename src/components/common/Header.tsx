import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Sparkles, 
  UserCheck, 
  Briefcase,
  LogOut,
  ExternalLink,
  ChevronDown,
  Menu,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { notifications, markNotificationAsRead } = useData();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_-4px_rgba(79,70,229,0.03)]">
      
      {/* Left Area */}
      <div className="flex items-center gap-3 w-96 max-w-[60%] sm:max-w-full">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-[#464555] hover:text-[#191C1D] hover:bg-[#F8F9FA] rounded-xl lg:hidden transition-colors border border-transparent hover:border-[#E5E7EB] shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#737380] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates, roles, skills, or metrics..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-sm text-[#191C1D] placeholder:text-[#8E8EA0] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">

        {/* AI Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-[#E6F4F1] text-[#0F766E] rounded-full text-xs font-medium border border-[#B9DFD8]">
          <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>HireMind Intelligence Active</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-[#464555] hover:text-[#191C1D] hover:bg-[#F8F9FA] rounded-xl transition-all border border-transparent hover:border-[#E5E7EB]"
          >
            <Bell className="w-5 h-5" />

            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#4F46E5] rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_10px_30px_-5px_rgba(79,70,229,0.12)] border border-[#E5E7EB] py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              
              <div className="px-4 pb-2 border-b border-[#E5E7EB] flex items-center justify-between">
                <span className="font-semibold text-sm text-[#191C1D]">
                  Notifications
                </span>

                <span className="text-xs text-[#4F46E5] font-medium">
                  {unreadCount} new
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                {notifications.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-3 hover:bg-[#F8F9FA] cursor-pointer transition-colors ${
                      !n.read ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[#4F46E5] shrink-0" />

                      <div>
                        <p className="text-xs font-semibold text-[#191C1D]">
                          {n.title}
                        </p>

                        <p className="text-xs text-[#464555] mt-0.5 leading-relaxed">
                          {n.message}
                        </p>

                        <span className="text-[10px] text-[#8E8EA0] mt-1 block">
                          {n.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#737380]">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifs(false);
            }}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-[#F8F9FA] transition-all border border-transparent hover:border-[#E5E7EB]"
          >
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-100"
            />

            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#191C1D] leading-tight">
                {user?.name}
              </p>

              <p className="text-[11px] text-[#737380] capitalize">
                {user?.role}
              </p>
            </div>

            <ChevronDown className="w-4 h-4 text-[#737380]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_30px_-5px_rgba(79,70,229,0.12)] border border-[#E5E7EB] py-2 z-50">
              
              {/* User Information */}
              <div className="px-4 py-2.5 border-b border-[#E5E7EB]">
                <p className="text-sm font-semibold text-[#191C1D]">
                  {user?.name}
                </p>

                <p className="text-xs text-[#737380] truncate">
                  {user?.email}
                </p>
              </div>

              {/* Menu */}
              <div className="py-1">

                {/* Candidate Profile */}
                {role === 'candidate' && onNavigate && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('candidate-profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#464555] hover:bg-[#F8F9FA] hover:text-[#3525CD] flex items-center gap-2"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    My Candidate Profile
                  </button>
                )}

                {/* Recruiter Profile */}
                {(role === 'recruiter' || role === 'admin') && onNavigate && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('recruiter-profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#464555] hover:bg-[#F8F9FA] hover:text-[#3525CD] flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    My Recruiter Profile
                  </button>
                )}

                {/* Landing Page */}
                {onNavigate && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigate('landing');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#464555] hover:bg-[#F8F9FA] hover:text-[#3525CD] flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Public Landing Page
                  </button>
                )}
              </div>

              {/* Logout */}
              <div className="pt-1 border-t border-[#E5E7EB]">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    void logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};