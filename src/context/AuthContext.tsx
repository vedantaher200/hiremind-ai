import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import {
  UserProfile,
  UserRole
} from '../types';

import {
  STORAGE_KEYS,
  getStoredItem,
  isSupabaseConfigured,
  setStoredItem,
  supabase,
  PROFILE_AVATARS_BUCKET
} from '../lib/supabase';

import { createClientId } from '../lib/id';

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
    organizationWebsite?: string
  ) => Promise<
    'signed_in' | 'confirmation_required'
  >;

  resetPassword: (
    email: string
  ) => Promise<void>;

  resendConfirmation: (email: string) => Promise<void>;

  logout: () => Promise<void>;

  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<void>;

  uploadAvatar: (file: File) => Promise<void>;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

const authRedirectUrl = () => {
  const configuredUrl = import.meta.env.VITE_APP_URL?.trim();
  const baseUrl = configuredUrl || window.location.origin;
  return `${baseUrl.replace(/\/$/, '')}/?confirmed=1`;
};

/* =========================================================
   PROFILE MAPPER
========================================================= */

const profileFromRow = (
  row: any,
  email: string
): UserProfile => ({
  id: row.id,

  name:
    row.name ||
    row.full_name ||
    'User',

  email:
    row.email ||
    email ||
    '',

  role:
    row.role || 'candidate',

  avatar:
    row.avatar_url ||
    row.avatar_path ||
    undefined,

  linkedinUrl: row.linkedin_url || undefined,

  githubUrl: row.github_url || undefined,

  portfolioUrl: row.portfolio_url || undefined,

  organizationWebsite: row.organization_website || undefined,

  phone:
    row.phone ||
    undefined,

  location:
    row.location ||
    undefined,

  title:
    row.title ||
    undefined,

  bio:
    row.bio ||
    undefined,

  matchScore:
    row.match_score ||
    undefined,

  skills:
    Array.isArray(row.skills)
      ? row.skills
      : [],

  experience:
    Array.isArray(row.experience)
      ? row.experience
      : [],

  education:
    Array.isArray(row.education)
      ? row.education
      : [],

  createdAt:
    row.created_at ||
    new Date().toISOString()
});

/* =========================================================
   AUTH PROVIDER
========================================================= */

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] =
    useState<UserProfile | null>(() =>
      isSupabaseConfigured
        ? null
        : getStoredItem(
            STORAGE_KEYS.AUTH_USER,
            null
          )
    );

  const [isLoading, setIsLoading] =
    useState(isSupabaseConfigured);

  /* =========================================================
     LOAD PROFILE
  ========================================================= */

  const loadProfile = async (
    authUser: {
      id: string;
      email?: string | null;
    }
  ): Promise<UserProfile> => {
    if (!supabase) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      throw new Error(
        'Your profile could not be loaded.'
      );
    }

    const profile = profileFromRow(data, authUser.email || '');
    setUser(profile);
    return profile;
  };

  /* =========================================================
     INITIAL SESSION + AUTH LISTENER
  ========================================================= */

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let active = true;

    void supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (
          data.session?.user &&
          active
        ) {
          try {
            await loadProfile(
              data.session.user
            );
          } catch (error) {
            console.error(
              'Profile loading failed:',
              error
            );

            await supabase.auth.signOut();

            if (active) {
              setUser(null);
            }
          }
        }

        if (active) {
          setIsLoading(false);
        }
      });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session?.user) {
            setUser(null);
            setIsLoading(false);
            return;
          }

          void loadProfile(session.user)
            .catch(error => {
              console.error(
                'Profile loading failed:',
                error
              );

              setUser(null);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }
      );

    return () => {
      active = false;

      listener.subscription.unsubscribe();
    };
  }, []);

  /* =========================================================
     LOCAL STORAGE FALLBACK
  ========================================================= */

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStoredItem(
        STORAGE_KEYS.AUTH_USER,
        user
      );
    }
  }, [user]);

  /* =========================================================
     LOGIN
  ========================================================= */

  const login = async (
    email: string,
    password: string,
    expectedRole?: UserRole
  ) => {
    if (!email.trim() || !password) {
      throw new Error(
        'Email and password are required.'
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (supabase) {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

      if (error || !data.user) {
        throw new Error(
          error?.message ||
            'Unable to sign in.'
        );
      }

      if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Please confirm your email before signing in. Use the resend option if you need a new confirmation link.');
      }

      const profile = await loadProfile(data.user);

      if (expectedRole && profile.role !== expectedRole) {
        await supabase.auth.signOut();
        setUser(null);
        throw new Error(`These credentials belong to a ${profile.role === 'recruiter' ? 'Recruiter' : 'Candidate'} account. Please switch to ${profile.role === 'recruiter' ? 'Recruiter' : 'Candidate'} or use the correct credentials.`);
      }

      return;
    }

    /* LOCAL FALLBACK */

    const account = getStoredItem<
      Array<UserProfile & { password: string }>
    >(
      STORAGE_KEYS.USERS,
      []
    ).find(
      item =>
        item.email === normalizedEmail &&
        item.password === password
    );

    if (!account) {
      throw new Error(
        'Invalid email or password.'
      );
    }

    const {
      password: _password,
      ...profile
    } = account;

    if (expectedRole && account.role !== expectedRole) {
      throw new Error(`These credentials belong to a ${account.role === 'recruiter' ? 'Recruiter' : 'Candidate'} account. Please switch to ${account.role === 'recruiter' ? 'Recruiter' : 'Candidate'} or use the correct credentials.`);
    }

    setUser(profile);
  };

  /* =========================================================
     SIGNUP
  ========================================================= */

  const signup = async (
    name: string,
    email: string,
    password: string,
    userRole: UserRole,
    organizationWebsite?: string
  ): Promise<
    'signed_in' | 'confirmation_required'
  > => {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (name.trim().length < 2) {
      throw new Error(
        'Enter your full name.'
      );
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        normalizedEmail
      )
    ) {
      throw new Error(
        'Enter a valid email address.'
      );
    }

    if (password.length < 8) {
      throw new Error(
        'Use a password of at least 8 characters.'
      );
    }

    if (
      userRole === 'recruiter' &&
      !/^https?:\/\/[^\s]+$/i.test(
        organizationWebsite || ''
      )
    ) {
      throw new Error(
        'Recruiter accounts require a valid organization website.'
      );
    }

    if (supabase) {
      const { data, error } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: authRedirectUrl(),
            data: {
              full_name: name.trim(),
              role: userRole,
              organization_website:
                organizationWebsite || null
            }
          }
        });

      if (error || !data.user) {
        throw new Error(
          error?.message ||
            'Unable to create account.'
        );
      }

      // Supabase intentionally returns an obfuscated user for an address that
      // already exists when email confirmation is enabled. Do not present that
      // response as a newly-created account or claim a mail was sent.
      if (!data.session && data.user.identities?.length === 0) {
        throw new Error('An account with this email already exists. Sign in or request a new confirmation email.');
      }

      if (!data.session) {
        return 'confirmation_required';
      }

      await loadProfile(data.user);

      return 'signed_in';
    }

    /* LOCAL FALLBACK */

    const accounts = getStoredItem<
      Array<UserProfile & { password: string }>
    >(
      STORAGE_KEYS.USERS,
      []
    );

    if (
      accounts.some(
        item =>
          item.email === normalizedEmail
      )
    ) {
      throw new Error(
        'An account already exists for this email.'
      );
    }

    const localUser: UserProfile = {
      id: createClientId('usr'),

      name: name.trim(),

      email: normalizedEmail,

      role: userRole,

      skills: [],

      experience: [],

      education: [],

      createdAt:
        new Date().toISOString(),

      bio:
        organizationWebsite ||
        undefined
    };

    setStoredItem(
      STORAGE_KEYS.USERS,
      [
        ...accounts,
        {
          ...localUser,
          password
        }
      ]
    );

    setUser(localUser);

    return 'signed_in';
  };

  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  const resetPassword = async (
    email: string
  ) => {
    if (!supabase) {
      throw new Error(
        'Password reset is available only when Supabase is configured.'
      );
    }

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: authRedirectUrl()
        }
      );

    if (error) {
      throw new Error(error.message);
    }
  };

  const resendConfirmation = async (email: string) => {
    if (!supabase) {
      throw new Error('Email confirmation is available only when Supabase is configured.');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      throw new Error('Enter the email address used to create your account.');
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: { emailRedirectTo: authRedirectUrl() }
    });
    if (error) throw new Error(error.message);
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = async () => {
    if (supabase) {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }
    }

    setUser(null);

    localStorage.removeItem(
      STORAGE_KEYS.AUTH_USER
    );
  };

  /* =========================================================
     UPDATE PROFILE
  ========================================================= */

  const updateProfile = async (
    updates: Partial<UserProfile>
  ) => {
    if (!user) {
      throw new Error(
        'You must be signed in to update your profile.'
      );
    }

    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name:
            updates.name ?? user.name,

          phone:
            updates.phone ?? user.phone,

          location:
            updates.location ??
            user.location,

          title:
            updates.title ?? user.title,

          bio:
            updates.bio ?? user.bio,

          avatar_url:
            updates.avatar ??
            user.avatar,

          linkedin_url:
            updates.linkedinUrl ?? user.linkedinUrl,

          github_url:
            updates.githubUrl ?? user.githubUrl,

          portfolio_url:
            updates.portfolioUrl ?? user.portfolioUrl,

          organization_website:
            updates.organizationWebsite ?? user.organizationWebsite,

          skills:
            updates.skills ??
            user.skills,

          experience:
            updates.experience ??
            user.experience,

          education:
            updates.education ??
            user.education
        })
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const accounts = getStoredItem<Array<UserProfile & { password: string }>>(
        STORAGE_KEYS.USERS,
        []
      );
      setStoredItem(
        STORAGE_KEYS.USERS,
        accounts.map(account =>
          account.id === user.id ? { ...account, ...updates } : account
        )
      );
    }

    setUser(current =>
      current
        ? {
            ...current,
            ...updates
          }
        : current
    );
  };

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('You must be signed in to upload an avatar.');
    if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
    if (file.size > 3 * 1024 * 1024) throw new Error('Profile images must be 3MB or smaller.');

    if (!supabase) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Unable to read the image.'));
        reader.readAsDataURL(file);
      });
      await updateProfile({ avatar: dataUrl });
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(PROFILE_AVATARS_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' });
    if (uploadError) {
      if (/bucket not found/i.test(uploadError.message)) {
        throw new Error(`Avatar upload failed: The Supabase Storage bucket "${PROFILE_AVATARS_BUCKET}" is missing. Apply supabase/migrations/004_profile_avatar_storage.sql first.`);
      }
      throw new Error(`Avatar upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(PROFILE_AVATARS_BUCKET).getPublicUrl(path);
    await updateProfile({ avatar: data.publicUrl });
  };

  /* =========================================================
     PROVIDER
  ========================================================= */

  return (
    <AuthContext.Provider
      value={{
        user,
        role:
          user?.role || 'candidate',
        isAuthenticated:
          Boolean(user),
        isLoading,
        login,
        signup,
        resetPassword,
        resendConfirmation,
        logout,
        updateProfile
        ,uploadAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =========================================================
   USE AUTH HOOK
========================================================= */

export const useAuth =
  (): AuthContextType => {
    const context =
      useContext(AuthContext);

    if (!context) {
      throw new Error(
        'useAuth must be used within an AuthProvider'
      );
    }

    return context;
  };
