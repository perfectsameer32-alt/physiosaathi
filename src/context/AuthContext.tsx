import React, { createContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_USERS } from '../lib/mockData';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isDemoMode: boolean;
  loginAsDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string; user?: UserProfile }>;
  signUpWithEmail: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error?: string; user?: UserProfile }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'pysiosaathi_demo_user';
const REGISTERED_USERS_KEY = 'pysiosaathi_registered_users';
const DOCTOR_PROFILES_KEY = 'pysiosaathi_doctor_profiles';

const getInitialUser = (): UserProfile | null => {
  const cachedDemoUser = localStorage.getItem(DEMO_STORAGE_KEY);
  if (cachedDemoUser) {
    try {
      const parsed = JSON.parse(cachedDemoUser);
      // If demo mode is explicitly disabled in .env and the user was a mock demo user, clear it so they can log in for real
      if (import.meta.env.VITE_DEMO_MODE === 'false' && parsed.id && parsed.id.startsWith('demo-')) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(!user);

  // Check if Demo Mode is explicitly disabled or enabled via .env
  const isDemoExplicitlyDisabled = import.meta.env.VITE_DEMO_MODE === 'false';
  const initialDemoMode = isDemoExplicitlyDisabled ? false : !isSupabaseConfigured;
  const [isDemoMode, setIsDemoMode] = useState(initialDemoMode);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      const fetchProfile = async (userId: string, email: string) => {
        try {
          if (!supabase) return;
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error || !data) {
            setUser({
              id: userId,
              email,
              full_name: email.split('@')[0],
              role: 'patient',
              created_at: new Date().toISOString(),
            });
          } else {
            setUser(data as UserProfile);
          }
        } catch {
          // fallback
        } finally {
          setIsLoading(false);
        }
      };

      // Check real Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setIsLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setIsDemoMode(true);
      setIsLoading(false);
    }
  }, [user]);

  const loginAsDemo = (role: UserRole) => {
    const demoProfile = DEMO_USERS[role] || DEMO_USERS.patient;
    setUser(demoProfile);
    setIsDemoMode(true);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string; user?: UserProfile }> => {
    // 1. When Supabase is configured, authenticate against real Supabase backend
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const loggedUser: UserProfile = (profile as UserProfile) || {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          role: data.user.user_metadata?.role || 'patient',
          created_at: new Date().toISOString(),
        };

        setUser(loggedUser);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(loggedUser));
        return { user: loggedUser };
      }
      return {};
    }

    // 2. Real persistent local authentication
    const registeredUsers: Array<{ user: UserProfile; passwordHash: string }> = JSON.parse(
      localStorage.getItem(REGISTERED_USERS_KEY) || '[]'
    );
    const matched = registeredUsers.find(
      (acc) => acc.user.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matched) {
      if (matched.passwordHash === password) {
        setUser(matched.user);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(matched.user));
        return { user: matched.user };
      }
      return { error: 'Incorrect password. Please verify your password and try again.' };
    }

    // 3. Fallback for demo accounts if demo mode is enabled
    if (isDemoMode) {
      const allDemoUsers = Object.values(DEMO_USERS);
      const matchedDemo = allDemoUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (matchedDemo) {
        setUser(matchedDemo);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(matchedDemo));
        return { user: matchedDemo };
      }
      const { DEMO_DOCTORS } = await import('../lib/mockData');
      const matchedDoctor = DEMO_DOCTORS.find(d => d.email.toLowerCase() === email.trim().toLowerCase());
      if (matchedDoctor) {
        setUser(matchedDoctor);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(matchedDoctor));
        return { user: matchedDoctor };
      }
      return { error: 'In demonstration mode, please use the Quick Demo buttons below or enter a demo email address.' };
    }

    return { error: 'No account found with this email. Please check your credentials or click "Create Account" below to register.' };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<{ error?: string; user?: UserProfile }> => {
    // 1. Real Supabase registration
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const newUser: UserProfile = {
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          created_at: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
            created_at: new Date().toISOString(),
          });

          if (role === 'physiotherapist') {
            await supabase.from('doctor_profiles').upsert({
              id: data.user.id,
              specialty: 'Physiotherapist & Rehabilitation Specialist',
              qualifications: ['BPT'],
              clinic_name: 'Pysiosaathi Clinic',
              is_demo: false,
            });
          }
        } catch {
          // Handled by database trigger if client insert is blocked
        }

        setUser(newUser);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(newUser));
        return { user: newUser };
      }

      return {};
    }

    // 2. Real persistent local registration
    const registeredUsers: Array<{ user: UserProfile; passwordHash: string }> = JSON.parse(
      localStorage.getItem(REGISTERED_USERS_KEY) || '[]'
    );

    const exists = registeredUsers.some(
      (acc) => acc.user.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (exists) {
      return { error: 'An account with this email address already exists. Please sign in.' };
    }

    const newUserId = `user-${Date.now()}`;
    const newUser: UserProfile = {
      id: newUserId,
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      created_at: new Date().toISOString(),
    };

    registeredUsers.push({
      user: newUser,
      passwordHash: password,
    });
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));

    // If registered as a doctor / physiotherapist, create a real doctor profile
    if (role === 'physiotherapist') {
      const localDocProfiles = JSON.parse(localStorage.getItem(DOCTOR_PROFILES_KEY) || '{}');
      localDocProfiles[newUserId] = {
        id: newUserId,
        full_name: fullName.trim(),
        email: email.trim(),
        specialty: 'Physiotherapist & Rehab Specialist',
        qualifications: ['BPT', 'MPT (Musculoskeletal)'],
        clinic_name: 'Pysiosaathi Rehabilitation Center',
        registration_number: `REG-${newUserId.slice(-6).toUpperCase()}`,
        bio: 'Licensed rehabilitation specialist providing evidence-based physical therapy care.',
        is_demo: false,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(DOCTOR_PROFILES_KEY, JSON.stringify(localDocProfiles));
    }

    setUser(newUser);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(newUser));
    return { user: newUser };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        isDemoMode,
        loginAsDemo,
        logout,
        signInWithEmail,
        signUpWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export { useAuth } from './useAuth';

