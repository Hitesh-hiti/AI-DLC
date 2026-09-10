/**
 * App Context
 * Global application state (traveler info, current booking, etc.)
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { TravelerRef, OrganizationRef } from '../api/types/common';

export interface AppContextType {
  // User/Traveler info
  traveler: TravelerRef | null;
  organization: OrganizationRef | null;

  // Authentication
  isAuthenticated: boolean;

  // Actions
  setTraveler: (traveler: TravelerRef) => void;
  setOrganization: (org: OrganizationRef) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [traveler, setTraveler] = useState<TravelerRef | null>(null);
  const [organization, setOrganization] = useState<OrganizationRef | null>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);

  const handleLogout = () => {
    setTraveler(null);
    setOrganization(null);
    setAuthenticated(false);
  };

  const value: AppContextType = {
    traveler,
    organization,
    isAuthenticated,
    setTraveler,
    setOrganization,
    setAuthenticated,
    logout: handleLogout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Hook to use App Context
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default AppContext;
