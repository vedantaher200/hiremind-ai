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
  supabase
} from '../lib/supabase';

import { createClientId } from '../lib/id';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    password: string
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

  logout: () => Promise<void>;

  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<void>;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

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
  ) => {
    if (!supabase) return;

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

    setUser(
      profileFromRow(
        data,
        authUser.email || ''
      )
    );
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
    password: string
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

      await loadProfile(data.user);

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
          redirectTo:
            `${window.location.origin}/`
        }
      );

    if (error) {
      throw new Error(error.message);
    }
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
        logout,
        updateProfile
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