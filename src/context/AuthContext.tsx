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
  ) => Promise<void>;

  signup: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organizationWebsite?: string,
    companyName?: string
  ) => Promise<'signed_in' | 'confirmation_required' | 'pending_approval'>;

  loginWithGoogle: (
    credential: string,
    role?: UserRole
  ) => Promise<void>;

  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUserResponse = (data: any, fallbackRole?: UserRole): UserProfile => {
  const rawRole = (data.role || fallbackRole || 'candidate').toLowerCase();
  const role: UserRole = rawRole === 'admin' ? 'admin' : rawRole === 'recruiter' ? 'recruiter' : 'candidate';

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

  const login = async (email: string, password: string, expectedRole?: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password, expectedRole);
      setToken(res.token);
      const mapped = mapUserResponse(res.user, expectedRole);
      setUser(mapped);
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organizationWebsite?: string,
    companyName?: string
  ): Promise<'signed_in' | 'confirmation_required' | 'pending_approval'> => {
    setIsLoading(true);
    try {
      if (role === 'recruiter') {
        const res = await api.auth.registerRecruiter({
          name,
          email,
          password,
          companyName: companyName || `${name}'s Company`,
          companyWebsite: organizationWebsite || 'https://example.com'
        });
        return 'pending_approval';
      } else {
        const res = await api.auth.registerCandidate({ name, email, password });
        setToken(res.token);
        const mapped = mapUserResponse(res.user, 'candidate');
        setUser(mapped);
        return 'signed_in';
      }
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, role: UserRole = 'candidate') => {
    setIsLoading(true);
    try {
      const res = await api.auth.google(credential, role.toUpperCase());
      setToken(res.token);
      const mapped = mapUserResponse(res.user, role);
      setUser(mapped);
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
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
    // In our file storage, we could upload via multipart
    const fakeAvatarUrl = URL.createObjectURL(file);
    await updateProfile({ avatar: fakeAvatarUrl });
  };

  const resetPassword = async (email: string) => {
    // Standard endpoint simulation
    await new Promise((r) => setTimeout(r, 600));
  };

  const resendConfirmation = async (email: string) => {
    await new Promise((r) => setTimeout(r, 600));
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
