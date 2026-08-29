import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  UserCheck, 
  Briefcase, 
  Lock, 
  Mail, 
  User, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
  onSuccess: () => void;
  onBackToLanding: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  initialRole = 'candidate',
  onSuccess,
  onBackToLanding
}) => {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationWebsite, setOrganizationWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        const result = await signup(name, email, password, role, organizationWebsite);
        if (result === 'confirmation_required') {
          setMessage('Account created. Check your email to confirm your account, then sign in.');
          setMode('login');
          return;
        }
      } else {
        await resetPassword(email);
        setMessage('If an account exists, password reset instructions have been sent.');
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      setMessage(err?.message || 'Authentication error occurred.');
    }
  };

  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back button */}
        <button
          onClick={onBackToLanding}
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#464555] hover:text-[#3525CD] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3525CD] to-[#712AE2] flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl text-[#191C1D] tracking-tight">
            HireMind <span className="text-[#4F46E5] font-black text-sm px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">AI</span>
          </span>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-[#191C1D]">
          {mode === 'login' && 'Sign in to HireMind AI'}
          {mode === 'register' && 'Create your HireMind account'}
          {mode === 'forgot' && 'Reset your password'}
        </h2>
        <p className="mt-1 text-center text-xs text-[#737380]">
          {mode === 'login' && 'Autonomous Multi-Modal Recruitment & Intelligence Platform'}
          {mode === 'register' && 'Join the future of intelligent precision recruitment'}
          {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E5E7EB] shadow-[0_20px_50px_-10px_rgba(79,70,229,0.08)]">
          {/* Role selector buttons */}
          {mode !== 'forgot' && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#464555] mb-2 uppercase tracking-wider">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('candidate')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                    role === 'candidate'
                      ? 'border-[#3525CD] bg-indigo-50/50 text-[#3525CD] shadow-xs'
                      : 'border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#464555]'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  <span className="text-xs font-bold">Candidate</span>
                  <span className="text-[10px] text-[#737380]">Interviews & Tests</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('recruiter')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                    role === 'recruiter'
                      ? 'border-[#3525CD] bg-indigo-50/50 text-[#3525CD] shadow-xs'
                      : 'border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#464555]'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="text-xs font-bold">Recruiter</span>
                  <span className="text-[10px] text-[#737380]">Hiring & Ranking</span>
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-medium text-[#3525CD] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#464555] uppercase tracking-wider">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <User className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Mehta"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-sm text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                  />
                </div>
              </div>
            )}
            {mode === 'register' && role === 'recruiter' && (
              <div>
                <label className="block text-xs font-bold text-[#464555] uppercase tracking-wider">Organization Website</label>
                <input type="url" required value={organizationWebsite} onChange={(e) => setOrganizationWebsite(e.target.value)} placeholder="https://company.example" className="mt-1 w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4F46E5]/20" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#464555] uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1 relative">
                <Mail className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-sm text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#464555] uppercase tracking-wider">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs font-semibold text-[#3525CD] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="mt-1 relative">
                  <Lock className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-sm text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#3525CD] to-[#712AE2] text-white text-sm font-bold shadow-[0_10px_20px_-5px_rgba(79,70,229,0.35)] hover:shadow-[0_15px_25px_-5px_rgba(79,70,229,0.45)] hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && `Continue as ${role === 'candidate' ? 'Candidate' : 'Recruiter'}`}
                      {mode === 'register' && `Create ${role === 'candidate' ? 'Candidate' : 'Recruiter'} Account`}
                      {mode === 'forgot' && 'Send Reset Instructions'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch Mode Links */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center text-xs text-[#464555]">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-[#3525CD] hover:underline"
                >
                  Create free account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#3525CD] hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
