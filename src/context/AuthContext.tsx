import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { api, getToken, setToken, clearToken } from '../lib/api';
import { STORAGE_KEYS, getStoredItem, setStoredItem } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string, expectedRole?: UserRole) => Promise<UserProfile>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organizationWebsite?: string,
    companyName?: string,
    setupKey?: string
  ) => Promise<{ status: 'signed_in' | 'confirmation_required' | 'pending_approval' | 'created'; user?: UserProfile }>;
  loginWithGoogle: (credential: string, role?: UserRole) => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map backend user object to UserProfile interface
const mapUserResponse = (data: any, fallbackRole?: UserRole): UserProfile => {
  const rawRole = (data.role || fallbackRole || 'candidate').toLowerCase();
  let role: UserRole = 'candidate';
  if (rawRole === 'admin' || rawRole === 'recruiter' || rawRole === 'candidate') {
    role = rawRole as UserRole;
  }

  return {
    id: data.id,
    name: data.full_name || data.name || 'User',
    email: data.email || '',
    role,
    avatar: data.avatar_url || data.avatar || undefined,
    title: data.title || undefined,
    location: data.location || undefined,
    phone: data.phone || undefined,
    bio: data.bio || undefined,
    linkedinUrl: data.linkedin_url || data.linkedinUrl || undefined,
    githubUrl: data.github_url || data.githubUrl || undefined,
    portfolioUrl: data.portfolio_url || data.portfolioUrl || undefined,
    organizationWebsite: data.organization_website || data.organizationWebsite || undefined,
    company: data.company,
    skills: Array.isArray(data.skills) ? data.skills : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    education: Array.isArray(data.education) ? data.education : [],
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    matchScore: data.match_score || data.matchScore || 85,
    profileCompletion: data.profile_completion || data.profileCompletion || 70,
    availabilityStatus: data.availability_status || data.availabilityStatus || 'Available',
    yearsOfExperience: data.years_of_experience || data.yearsOfExperience || 2
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Session restoration on application startup
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const token = getToken();
        if (token) {
          try {
            const data = await api.auth.me();
            if (isMounted && data) {
              const mapped = mapUserResponse(data);
              setUser(mapped);
              setStoredItem(STORAGE_KEYS.AUTH_USER, mapped);
            }
          } catch (err) {
            console.warn('[AUTH] Token invalid or expired, clearing session:', err);
            clearToken();
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
            if (isMounted) setUser(null);
          }
        } else {
          // Local storage session fallback for offline/demo
          const storedUser = getStoredItem<UserProfile | null>(STORAGE_KEYS.AUTH_USER, null);
          if (storedUser && isMounted) {
            setUser(storedUser);
          }
        }
      } catch (err) {
        console.warn('[AUTH] Session restoration warning:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => { isMounted = false; };
  }, []);

  /* ---------------- LOGIN FLOW ---------------- */
  const login = async (
    email: string,
    password: string,
    expectedRole?: UserRole
  ): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const data = await api.auth.login(email, password, expectedRole);
      
      if (data.token) setToken(data.token);
      
      const mapped = mapUserResponse(data.user, expectedRole);
      setUser(mapped);
      setStoredItem(STORAGE_KEYS.AUTH_USER, mapped);
      
      setIsLoading(false);
      return mapped;
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  /* ---------------- REGISTRATION FLOW ---------------- */
  const signup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    organizationWebsite?: string,
    companyName?: string,
    setupKey?: string
  ): Promise<{ status: 'signed_in' | 'confirmation_required' | 'pending_approval' | 'created'; user?: UserProfile }> => {
    setIsLoading(true);
    
    try {
      if (role === 'admin') {
        await api.auth.registerAdmin({ name, email, password, setupKey });
        setIsLoading(false);
        return { status: 'created' };
      } 
      
      if (role === 'recruiter') {
        if (!companyName || !organizationWebsite) {
          throw new Error('Company name and website are required for recruiters.');
        }
        await api.auth.registerRecruiter({
          name, email, password, companyName, companyWebsite: organizationWebsite
        });
        setIsLoading(false);
        return { status: 'pending_approval' };
      }
      
      // Candidate registration
      const data = await api.auth.registerCandidate({ name, email, password });
      
      if (data.token) setToken(data.token);
      
      const mapped = mapUserResponse(data.user, role);
      setUser(mapped);
      setStoredItem(STORAGE_KEYS.AUTH_USER, mapped);
      
      setIsLoading(false);
      return { status: 'signed_in', user: mapped };
      
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  /* ---------------- GOOGLE AUTH ---------------- */
  const loginWithGoogle = async (credential: string, targetRole: UserRole = 'candidate'): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const data = await api.auth.google(credential, targetRole);
      if (data.token) setToken(data.token);
      
      const mapped = mapUserResponse(data.user, targetRole);
      setUser(mapped);
      setStoredItem(STORAGE_KEYS.AUTH_USER, mapped);
      
      setIsLoading(false);
      return mapped;
    } catch (err: any) {
      clearToken();
      setUser(null);
      setIsLoading(false);
      throw err;
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = async () => {
    clearToken();
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  };

  /* ---------------- UPDATE PROFILE ---------------- */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('You must be signed in to update your profile.');
    
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.linkedinUrl !== undefined) dbUpdates.linkedinUrl = updates.linkedinUrl;
      if (updates.githubUrl !== undefined) dbUpdates.githubUrl = updates.githubUrl;
      if (updates.portfolioUrl !== undefined) dbUpdates.portfolioUrl = updates.portfolioUrl;
      if (updates.organizationWebsite !== undefined) dbUpdates.organizationWebsite = updates.organizationWebsite;
      if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
      if (updates.experience !== undefined) dbUpdates.experience = updates.experience;
      if (updates.education !== undefined) dbUpdates.education = updates.education;

      const data = await api.auth.updateProfile(dbUpdates);
      const mapped = mapUserResponse(data.user, user.role);
      
      setUser(mapped);
      setStoredItem(STORAGE_KEYS.AUTH_USER, mapped);
    } catch (err) {
      console.warn('[AUTH] Database profile update notice:', err);
      throw err;
    }
  };

  /* ---------------- UPLOAD AVATAR ---------------- */
  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('You must be signed in to upload an avatar.');
    try {
      const data = await api.auth.uploadAvatar(file);
      const mapped = mapUserResponse(data.user, user.role);
      setUser(mapped);
      setStoredItem(STORAGE_KEYS.AUTH_USER, mapped);
    } catch (err) {
      throw err;
    }
  };

  /* ---------------- PASSWORD RESET ---------------- */
  const resetPassword = async (email: string) => {
    await api.auth.forgotPassword(email);
  };

  /* ---------------- RESEND VERIFICATION EMAIL ---------------- */
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
