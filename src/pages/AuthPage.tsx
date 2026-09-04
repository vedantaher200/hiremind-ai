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
  const { login, signup, resetPassword, resendConfirmation } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationWebsite, setOrganizationWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        await login(email, password, role);
      } else if (mode === 'register') {
        const result = await signup(name, email, password, role, organizationWebsite);
        if (result === 'confirmation_required') {
          setConfirmationEmail(email.trim().toLowerCase());
          setMessageType('success');
          setMessage('Your account was created. Confirm your email to activate it.');
          setLoading(false);
          return;
        }
      } else {
        await resetPassword(email);
        setMessageType('success');
        setMessage('If an account exists, password reset instructions have been sent.');
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      setMessageType('error');
      setMessage(err?.message || 'Authentication error occurred.');
    }
  };

  const handleRoleSelect = (newRole: UserRole) => {
    if (newRole === role) return;
    setRole(newRole);
    setEmail('');
    setPassword('');
    setMessage(null);
    setConfirmationEmail(null);
  };

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return;
    setLoading(true);
    setMessage(null);
    try {
      await resendConfirmation(confirmationEmail);
      setMessageType('success');
      setMessage(`A new confirmation email was sent to ${confirmationEmail}.`);
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Unable to resend the confirmation email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back button */}
        <button
          onClick={onBackToLanding}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-orange-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-700 flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl text-[#191C1D] tracking-tight">
            HireMind <span className="text-orange-700 font-bold text-sm">AI</span>
          </span>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold text-[#191C1D]">
          {mode === 'login' && 'Welcome back'}
          {mode === 'register' && 'Create your account'}
          {mode === 'forgot' && 'Reset your password'}
        </h2>
        <p className="mt-1 text-center text-xs text-[#737380]">
          {mode === 'login' && 'Sign in to continue to your recruitment workspace.'}
          {mode === 'register' && 'Set up your candidate or recruiter workspace.'}
          {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm">
          {confirmationEmail ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-700 mx-auto flex items-center justify-center"><Mail className="w-6 h-6" /></div>
              <div><h3 className="text-lg font-semibold text-slate-900">Confirm your email</h3><p className="mt-2 text-sm leading-6 text-slate-600">We sent a confirmation link to <strong>{confirmationEmail}</strong>. Open it to activate your account, then you’ll return here automatically.</p></div>
              {message && <div className={`p-3 rounded-lg text-sm text-left ${messageType === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-orange-50 text-orange-800 border border-orange-100'}`}>{message}</div>}
              <button type="button" onClick={() => void handleResendConfirmation()} disabled={loading} className="w-full py-2.5 rounded-lg bg-orange-700 hover:bg-orange-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors">{loading ? 'Sending…' : 'Resend confirmation email'}</button>
              <button type="button" onClick={() => { setConfirmationEmail(null); setMode('login'); setMessage(null); }} className="text-sm font-medium text-orange-700 hover:text-orange-800">Back to sign in</button>
            </div>
          ) : <>
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
            <div className={`mb-4 p-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${messageType === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-orange-50 border-orange-100 text-orange-800'}`}>
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
                  key={`email-${role}`}
                  name={`${role}-email`}
                  autoComplete="username"
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
                    key={`password-${role}`}
                    name={`${role}-password`}
                    autoComplete="current-password"
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
                className="w-full mt-2 py-3 rounded-xl bg-[#0F766E] text-white text-sm font-bold shadow-sm hover:bg-[#115E59] active:bg-[#0B4F4A] disabled:bg-[#94A3B8] disabled:text-white disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] transition-colors flex items-center justify-center gap-2 enabled:cursor-pointer"
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
          </>}
        </div>
      </div>
    </div>
  );
};
