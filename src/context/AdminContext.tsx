// src/context/AdminContext.tsx
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserRegion } from '@/data/users';

interface AdminContextType {
  adminSelectedRegion: UserRegion;
  setAdminSelectedRegion: (region: UserRegion) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_REGION_STORAGE_KEY = 'arenaClashAdminRegion';

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminSelectedRegion, setAdminSelectedRegionState] = useState<UserRegion>('USA'); // Default to USA, will be overwritten by localStorage if present
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load saved region from localStorage on mount
    const savedRegion = localStorage.getItem(ADMIN_REGION_STORAGE_KEY) as UserRegion | null;
    if (savedRegion === 'INDIA' || savedRegion === 'USA') {
      setAdminSelectedRegionState(savedRegion);
    } else {
      // If localStorage is empty or has an invalid value, explicitly set to 'USA'
      // This ensures the state aligns with the initial useState default or a deliberate choice.
      setAdminSelectedRegionState('USA');
      localStorage.setItem(ADMIN_REGION_STORAGE_KEY, 'USA'); // Optionally, persist the default if not set
    }
    setIsInitialized(true);
  }, []);

  const setAdminSelectedRegion = useCallback((region: UserRegion) => {
    if (region === 'USA' || region === 'INDIA') {
      setAdminSelectedRegionState(region);
      localStorage.setItem(ADMIN_REGION_STORAGE_KEY, region);
    } else {
        console.warn("Attempted to set invalid admin region:", region);
    }
  }, []);

  if (!isInitialized) {
    return null; // Or a loading spinner if preferred, to prevent rendering children before region is loaded
  }

  return (
    <AdminContext.Provider value={{ adminSelectedRegion, setAdminSelectedRegion }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};
