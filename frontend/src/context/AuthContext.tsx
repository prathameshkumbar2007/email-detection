import React, { createContext, useContext, useState } from 'react';

export interface UserProfile {
  name: string;
  role: string;
  email: string;
  badgeId: string;
  clearance: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  loginAs: (profile: UserProfile) => void;
  logout: () => void;
}

const DEFAULT_ANALYST: UserProfile = {
  name: 'Sarah Chen',
  role: 'Lead Threat Analyst (Tier 3)',
  email: 's.chen@cybertrace.internal',
  badgeId: 'SOC-9042',
  clearance: 'TS/SCI Cyber Forensics'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_ANALYST);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const loginAs = (profile: UserProfile) => {
    setUser(profile);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
