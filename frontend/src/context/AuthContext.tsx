"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    uid: 'mock-user-id',
    email: 'testuser@example.com',
    displayName: 'Test User',
    photoURL: 'https://via.placeholder.com/150',
  } as any);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Authentication disabled for testing
    setLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    toast.success("Testing mode: Already signed in as Test User");
  };

  const logout = async () => {
    toast.error("Testing mode: Logout disabled");
  };

  const getToken = async () => {
    return "mock-token";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
