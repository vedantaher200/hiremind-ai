import React, { useEffect, useRef, useState } from 'react';
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
import { api } from '../lib/api';

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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [adminSetupSuccess, setAdminSetupSuccess] = useState(false);
  const submittingRef = useRef(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleLoginRef = useRef(loginWithGoogle);
  const onSuccessRef = useRef(onSuccess);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState('');

  googleLoginRef.current = loginWithGoogle;
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (mode !== 'login' || role === 'admin') return;
    let cancelled = false;
    setGoogleReady(false);
    setGoogleConfigError('');
    setGoogleClientId(null);
    api.auth.googleConfig()
      .then((configuration) => {
        if (!cancelled && configuration.enabled && configuration.clientId) {
          setGoogleClientId(configuration.clientId);
        }
      })
      .catch(() => {
        // Keep email sign-in available and hide Google when the server cannot confirm its configuration.
      });
    return () => { cancelled = true; };
  }, [mode, role]);

  useEffect(() => {
    if (mode !== 'login' || role === 'admin' || !googleClientId) return;
    let cancelled = false;
    setGoogleReady(false);
    setGoogleConfigError('');
    const mountGoogleButton = () => {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential || submittingRef.current) return;
          submittingRef.current = true;
          setLoading(true);
          setMessage(null);
          try {
            const authenticatedUser = await googleLoginRef.current(credential, role);
            onSuccessRef.current(authenticatedUser);
          } catch (err: any) {
            setMessageType('error');
            setMessage(err?.message || 'Google Sign-In failed.');
          } finally {
            submittingRef.current = false;
            setLoading(false);
          }
        }
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular',
        width: Math.min(420, googleButtonRef.current.clientWidth || 360)
      });
      setGoogleReady(true);
      setGoogleConfigError('');
    };
    let script = document.getElementById('google-identity-services') as HTMLScriptElement | null;
    if (window.google?.accounts?.id) mountGoogleButton();
    else if (script) {
      script.addEventListener('load', mountGoogleButton);
      const onScriptError = () => setGoogleConfigError('Google sign-in could not load. Check your connection or use email and password.');
      script.addEventListener('error', onScriptError);
      return () => {
        cancelled = true;
        script?.removeEventListener('load', mountGoogleButton);
        script?.removeEventListener('error', onScriptError);
      };
    } else {
      script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = mountGoogleButton;
      script.onerror = () => setGoogleConfigError('Google sign-in could not load. Check your connection or use email and password.');
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [mode, role, googleClientId]);

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    if (newMode !== 'forgot') {
      onModeChange?.(newMode);
    }
    setPassword('');
    setConfirmPassword('');
    setAdminSetupKey('');
    setMessage(null);
    setFieldErrors({});
    setPendingApproval(false);
    setAdminSetupSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setMessage(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (mode === 'register') {
      if (!cleanName || cleanName.length < 2) {
        setLoading(false);
        setMessageType('error');
        setMessage('Please enter your full name (minimum 2 characters).');
        submittingRef.current = false;
        return;
      }
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setLoading(false);
        setMessageType('error');
        setMessage('Please enter a valid email address.');
        submittingRef.current = false;
        return;
      }
      if (password.length < 8) {
        setLoading(false);
        setMessageType('error');
        setMessage('Password must be at least 8 characters long.');
        submittingRef.current = false;
        return;
      }
      if (password !== confirmPassword) {
        setLoading(false);
        setMessageType('error');
        setMessage('Passwords do not match. Please verify.');
        submittingRef.current = false;
        return;
      }
      if (role === 'recruiter' && organizationWebsite && !/^https?:\/\/[^\s]+$/i.test(organizationWebsite)) {
        setLoading(false);
        setMessageType('error');
        setMessage('Please enter a valid organization website (e.g. https://example.com).');
        submittingRef.current = false;
        return;
      }
    } else if (mode === 'login') {
      const errors: { email?: string; password?: string } = {};
      if (!cleanEmail) errors.email = 'Enter your email address.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.email = 'Enter a valid email address.';
      if (!password) errors.password = 'Enter your password.';
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        setMessage(null);
        submittingRef.current = false;
        return;
      }
    } else {
      setFieldErrors({});
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const loggedInUser = await login(cleanEmail, password, role);
        onSuccess(loggedInUser);
      } else if (mode === 'register') {
        const result = await signup(cleanName, cleanEmail, password, role, organizationWebsite, companyName, adminSetupKey);
        if (result.status === 'confirmation_required') {
          switchMode('login');
          setMessageType('info');
          setMessage('Registration successful! Please check your email to verify your account before signing in.');
          return;
        }
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
        await resetPassword(cleanEmail);
        setMessageType('success');
        setMessage('If an account exists with this email, password reset instructions have been dispatched.');
      }
    } catch (err: any) {
      setLoading(false);
      setMessageType('error');
      if (err?.code === 'COMPANY_PENDING') {
        setMessage('Your company registration is currently pending Admin review. Please wait for approval before logging in.');
      } else if (err?.code === 'COMPANY_REJECTED') {
        setMessage(`Company verification was rejected. Reason: ${err.rejectionReason || 'Eligibility criteria not met'}`);
      } else if (err?.code === 'ROLE_MISMATCH' || err?.message?.includes('credentials belong to')) {
        setMessage(err.message || 'Account role mismatch. Please select the correct tab.');
      } else if (err?.message?.includes('verify your email')) {
        setMessage('Please verify your email before signing in.');
      } else if (err?.message?.includes('Invalid email or password')) {
        setMessage('Invalid email or password.');
      } else {
        setMessage(err?.message || 'Authentication error occurred. Please try again.');
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back button */}
        <button
          onClick={onBackToLanding}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-[#0F766E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0F766E] flex items-center justify-center shadow-sm shadow-teal-900/15">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl text-[#191C1D] tracking-tight">
            HireMind <span className="text-[#0F766E] font-bold text-sm">AI</span>
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
                className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-semibold transition-colors cursor-pointer"
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
                          ? 'border-[#0F766E] bg-[#E6F4F1] text-[#0F766E] font-bold'
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
                          ? 'border-[#0F766E] bg-[#E6F4F1] text-[#0F766E] font-bold'
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
                          ? 'border-[#0F766E] bg-[#E6F4F1] text-[#0F766E] font-bold'
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
              {mode === 'login' && role !== 'admin' && googleClientId && (
                <div className="mb-5">
                  <div ref={googleButtonRef} className="flex min-h-10 w-full justify-center" aria-label="Google sign-in" />
                  {!googleReady && <p role="status" className="mt-2 text-center text-[11px] text-amber-700">{googleConfigError || 'Loading Google sign-in…'}</p>}

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

              <form className="space-y-3" onSubmit={handleSubmit} noValidate={mode === 'login'}>
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
                      required={mode !== 'login'}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'signin-email-error' : undefined}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldErrors((current) => ({ ...current, email: undefined })); }}
                      placeholder={role === 'admin' ? 'admin@hiremind.ai' : 'name@example.com'}
                      className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                    />
                  </div>
                  {mode === 'login' && fieldErrors.email && <p id="signin-email-error" className="mt-1 text-xs text-rose-700" role="alert">{fieldErrors.email}</p>}
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
                        required={mode !== 'login'}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? 'signin-password-error' : undefined}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: undefined })); }}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs text-[#191C1D] placeholder:text-[#8E8EA0] focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] outline-none"
                      />
                    </div>
                    {mode === 'login' && fieldErrors.password && <p id="signin-password-error" className="mt-1 text-xs text-rose-700" role="alert">{fieldErrors.password}</p>}
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
                      className="font-bold text-[#0F766E] hover:underline cursor-pointer"
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
                      className="font-bold text-[#0F766E] hover:underline cursor-pointer"
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
