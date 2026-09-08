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
  CheckCircle2,
  Building,
  ShieldCheck,
  Globe,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserRole } from '../types';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  initialRole?: UserRole;
  onSuccess: (user: UserProfile) => void;
  onBackToLanding: () => void;
  onRoleChange?: (role: UserRole) => void;
  onModeChange?: (mode: 'login' | 'register') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  initialRole = 'candidate',
  onSuccess,
  onBackToLanding,
  onRoleChange,
  onModeChange
}) => {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [organizationWebsite, setOrganizationWebsite] = useState('');
  const [adminSetupKey, setAdminSetupKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [adminSetupSuccess, setAdminSetupSuccess] = useState(false);

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    if (newMode !== 'forgot') {
      onModeChange?.(newMode);
    }
    setPassword('');
    setConfirmPassword('');
    setAdminSetupKey('');
    setMessage(null);
    setPendingApproval(false);
    setAdminSetupSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === 'register' && password !== confirmPassword) {
      setLoading(false);
      setMessageType('error');
      setMessage('Passwords do not match. Please verify.');
      return;
    }

    try {
      if (mode === 'login') {
        const loggedInUser = await login(email, password, role);
        setLoading(false);
        onSuccess(loggedInUser);
      } else if (mode === 'register') {
        const result = await signup(name, email, password, role, organizationWebsite, companyName, adminSetupKey);
        setLoading(false);
        if (result.status === 'pending_approval') {
          setPendingApproval(true);
          return;
        }
        if (role === 'admin' || result.status === 'created') {
          setAdminSetupSuccess(true);
          return;
        }
        if (result.user) {
          onSuccess(result.user);
        } else {
          switchMode('login');
          setMessageType('success');
          setMessage('Account created successfully! Please sign in with your credentials.');
        }
      } else {
        await resetPassword(email);
        setMessageType('success');
        setMessage('If an account exists with this email, password reset instructions have been dispatched.');
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      setMessageType('error');
      if (err?.code === 'COMPANY_PENDING') {
        setMessage('Your company registration is currently pending Admin review. Please wait for approval before logging in.');
      } else if (err?.code === 'COMPANY_REJECTED') {
        setMessage(`Company verification was rejected. Reason: ${err.rejectionReason || 'Eligibility criteria not met'}`);
      } else if (err?.code === 'ROLE_MISMATCH') {
        setMessage(err.message || 'Account role mismatch. Please select the correct tab.');
      } else {
        setMessage(err?.message || 'Authentication error occurred. Please check your details.');
      }
    }
  };

  const handleRoleSelect = (newRole: UserRole) => {
    if (newRole === role) return;
    setRole(newRole);
    onRoleChange?.(newRole);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAdminSetupKey('');
    setMessage(null);
    setPendingApproval(false);
    setAdminSetupSuccess(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const devPayload = {
        email: role === 'candidate' ? 'rahul.google@example.com' : 'recruiter.google@example.com',
        name: role === 'candidate' ? 'Rahul Mehta (Google)' : 'TechCorp Recruiter (Google)'
      };
      const token = btoa(JSON.stringify(devPayload));
      const loggedInUser = await loginWithGoogle(token, role);
      setLoading(false);
      onSuccess(loggedInUser);
    } catch (err: any) {
      setLoading(false);
      setMessageType('error');
      setMessage(err?.message || 'Google Sign-In failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back button */}
        <button
          onClick={onBackToLanding}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-orange-700 transition-colors cursor-pointer"
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
          {mode === 'login' && (role === 'admin' ? 'Administrator Sign In' : role === 'recruiter' ? 'Recruiter Sign In' : 'Candidate Sign In')}
          {mode === 'register' && (role === 'admin' ? 'Provision Admin Account' : role === 'recruiter' ? 'Recruiter Registration' : 'Create Candidate Account')}
          {mode === 'forgot' && 'Reset your password'}
        </h2>
        <p className="mt-1 text-center text-xs text-[#737380]">
          {mode === 'login' && (role === 'admin' ? 'Sign in to access platform governance and recruiter verifications.' : role === 'recruiter' ? 'Sign in to manage company postings and evaluate candidates.' : 'Sign in to access your dashboard, assessments, and applications.')}
          {mode === 'register' && (role === 'admin' ? 'Authorized setup requiring your server-side Admin Setup Key.' : role === 'recruiter' ? 'Submit your company details for administrator verification.' : 'Join HireMind AI to discover jobs, internships, and take AI assessments.')}
          {mode === 'forgot' && 'Enter your registered email for password recovery.'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm">
          {pendingApproval ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Company Verification Pending</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Your recruiter registration and company details have been recorded. Our platform administrator is reviewing your company. You will be able to log in once approved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingApproval(false);
                  setMode('login');
                  setMessage(null);
                }}
                className="w-full py-2.5 rounded-lg bg-orange-700 hover:bg-orange-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          ) : adminSetupSuccess ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Admin Account Created Successfully</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Your platform administrator account for <span className="font-semibold text-slate-900">{email}</span> has been provisioned. Please continue to Admin Sign In with your credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminSetupSuccess(false);
                  setMode('login');
                  setRole('admin');
                  onModeChange?.('login');
                  onRoleChange?.('admin');
                  setPassword('');
                  setConfirmPassword('');
                  setAdminSetupKey('');
                  setMessage(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Admin Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Role selector tabs */}
              {mode !== 'forgot' && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-[#464555] mb-2 uppercase tracking-wider">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('candidate')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                        role === 'candidate'
                          ? 'border-[#3525CD] bg-indigo-50/60 text-[#3525CD] font-bold'
                          : 'border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#464555]'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span className="text-xs">Candidate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleSelect('recruiter')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                        role === 'recruiter'
                          ? 'border-[#3525CD] bg-indigo-50/60 text-[#3525CD] font-bold'
                          : 'border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#464555]'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs">Recruiter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleSelect('admin')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                        role === 'admin'
                          ? 'border-[#3525CD] bg-indigo-50/60 text-[#3525CD] font-bold'
                          : 'border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#464555]'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs">Admin</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status/Error Messages */}
              {message && (
                <div
                  className={`mb-4 p-3 rounded-lg border text-xs font-medium flex items-start gap-2 ${
                    messageType === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : messageType === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {messageType === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {/* Google Sign-In Button */}
              {mode === 'login' && role !== 'admin' && (
                <div className="mb-5">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google ({role === 'candidate' ? 'Candidate' : 'Recruiter'})</span>
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400 font-medium">Or continue with email</span>
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-3" onSubmit={handleSubmit}>
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
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Mehta"
                        className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && role === 'recruiter' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#464555] uppercase tracking-wider">
                        Company Name
                      </label>
                      <div className="mt-1 relative">
                        <Building className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          autoComplete="organization"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme Innovations Inc."
                          className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#464555] uppercase tracking-wider">
                        Company Website
                      </label>
                      <div className="mt-1 relative">
                        <Globe className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          required
                          autoComplete="url"
                          value={organizationWebsite}
                          onChange={(e) => setOrganizationWebsite(e.target.value)}
                          placeholder="https://company.example.com"
                          className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                        />
                      </div>
                    </div>
                  </>
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
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === 'admin' ? 'admin@hiremind.ai' : 'name@example.com'}
                      className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
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
                          onClick={() => switchMode('forgot')}
                          className="text-xs font-semibold text-[#3525CD] hover:underline cursor-pointer"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="mt-1 relative">
                      <Lock className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-[#464555] uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="mt-1 relative">
                      <Lock className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && role === 'admin' && (
                  <div>
                    <label className="block text-xs font-bold text-[#464555] uppercase tracking-wider">
                      Admin Setup Key
                    </label>
                    <div className="mt-1 relative">
                      <ShieldCheck className="w-4 h-4 text-[#8E8EA0] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        autoComplete="off"
                        value={adminSetupKey}
                        onChange={(e) => setAdminSetupKey(e.target.value)}
                        placeholder="Enter server admin provisioning key"
                        className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Required only for controlled administrator account setup.</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-xs hover:bg-[#115E59] disabled:bg-[#94A3B8] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <span>
                          {mode === 'login' && (role === 'admin' ? 'Sign In to Admin Dashboard' : role === 'recruiter' ? 'Sign In as Recruiter' : 'Sign In as Candidate')}
                          {mode === 'register' && (role === 'recruiter' ? 'Submit Company Application' : role === 'admin' ? 'Provision Admin Account' : 'Create Candidate Account')}
                          {mode === 'forgot' && 'Send Reset Instructions'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Switch Mode Links */}
              <div className="mt-5 pt-4 border-t border-[#E5E7EB] text-center text-xs text-[#464555]">
                {mode === 'login' ? (
                  <p>
                    {role === 'admin' ? 'Need to provision initial admin? ' : "Don't have an account yet? "}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#3525CD] hover:underline cursor-pointer"
                    >
                      {role === 'admin' ? 'Provision with Setup Key' : 'Register here'}
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#3525CD] hover:underline cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
