import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';
import { UserProfile, UserRole } from '../types';
import { api, getToken, setToken, clearToken } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => Promise<UserProfile>;

  signup: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organizationWebsite?: string,
    companyName?: string,
    setupKey?: string
  ) => Promise<{ status: 'signed_in' | 'pending_approval' | 'created'; user?: UserProfile }>;

  loginWithGoogle: (
    credential: string,
    role?: UserRole
  ) => Promise<UserProfile>;

  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUserResponse = (data: any, fallbackRole?: UserRole): UserProfile => {
  const rawRole = (data.role || fallbackRole || '').toLowerCase();
  if (rawRole !== 'admin' && rawRole !== 'recruiter' && rawRole !== 'candidate') {
    throw new Error(`Invalid or missing user role: "${data.role}"`);
  }
  const role: UserRole = rawRole as UserRole;

  return {
    id: data.id,
    name: data.name || 'User',
    email: data.email || '',
    role,
    avatar: data.avatar || undefined,
    title: data.title || undefined,
    location: data.location || undefined,
    phone: data.phone || undefined,
    bio: data.bio || undefined,
    linkedinUrl: data.linkedinUrl || undefined,
    githubUrl: data.githubUrl || undefined,
    portfolioUrl: data.portfolioUrl || undefined,
    organizationWebsite: data.company?.website || data.organizationWebsite || undefined,
    company: data.company,
    skills: Array.isArray(data.skills) ? data.skills : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    education: Array.isArray(data.education) ? data.education : [],
    createdAt: data.createdAt || new Date().toISOString(),
    matchScore: data.matchScore || 85,
    profileCompletion: data.profileCompletion || 70,
    availabilityStatus: data.availabilityStatus || 'Available',
    yearsOfExperience: data.yearsOfExperience || 2
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await api.auth.me();
        if (profile && profile.id) {
          setUser(mapUserResponse(profile));
        } else {
          clearToken();
          setUser(null);
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string,
    expectedRole?: UserRole
  ): Promise<UserProfile> => {
    try {
      const res = await api.auth.login(email, password, expectedRole);
      setToken(res.token);
      const mapped = mapUserResponse(res.user, expectedRole);
      setUser(mapped);
      return mapped;
    } catch (err: any) {
      clearToken();
      setUser(null);
      throw err;
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organizationWebsite?: string,
    companyName?: string,
    setupKey?: string
  ): Promise<{ status: 'signed_in' | 'pending_approval' | 'created'; user?: UserProfile }> => {
    try {
      if (role === 'recruiter') {
        await api.auth.registerRecruiter({
          name,
          email,
          password,
          companyName: companyName || `${name}'s Company`,
          companyWebsite: organizationWebsite || 'https://example.com'
        });
        return { status: 'pending_approval' };
      } else if (role === 'admin') {
        const res = await api.auth.registerAdmin({
          name,
          email,
          password,
          setupKey: setupKey || organizationWebsite
        });
        const mappedAdmin = res.user ? mapUserResponse(res.user, 'admin') : undefined;
        return { status: 'created', user: mappedAdmin };
      } else {
        const res = await api.auth.registerCandidate({ name, email, password });
        setToken(res.token);
        const mapped = mapUserResponse(res.user, 'candidate');
        setUser(mapped);
        return { status: 'signed_in', user: mapped };
      }
    } catch (err: any) {
      throw err;
    }
  };

  const loginWithGoogle = async (credential: string, role: UserRole = 'candidate'): Promise<UserProfile> => {
    try {
      const res = await api.auth.google(credential, role.toUpperCase());
      setToken(res.token);
      const mapped = mapUserResponse(res.user, role);
      setUser(mapped);
      return mapped;
    } catch (err: any) {
      clearToken();
      setUser(null);
      throw err;
    }
  };

  const logout = async () => {
    clearToken();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const res = await api.auth.updateProfile(updates);
      setUser(mapUserResponse(res.user, user.role));
    } catch (err: any) {
      throw err;
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const res = await api.auth.uploadAvatar(file);
      if (res?.avatar) {
        setUser((prev) => (prev ? { ...prev, avatar: res.avatar } : null));
      }
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    await api.auth.forgotPassword(email);
  };

  const resendConfirmation = async (email: string) => {
    await api.auth.resendVerification(email);
  };

  const role: UserRole = user?.role || 'candidate';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        resendConfirmation,
        logout,
        updateProfile,
        uploadAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
