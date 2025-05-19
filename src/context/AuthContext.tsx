// src/context/AuthContext.tsx
'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { getUserByEmail, addUser, type UserRecord, type CreateUserData, updateUser, type WalletBalance, type UserRegion } from '@/data/users'; 
import { firebaseInitialized } from '@/lib/firebase'; 
import { AlertTriangle } from 'lucide-react';


export interface AuthenticatedUser extends Omit<UserRecord, 'password_local_file'> {
  bannerURL?: string | null;
  walletBalance: WalletBalance;
  region: UserRegion;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  authError: string | null;
  promptRegionSelection: boolean; // New state
  login: (email: string, password_provided: string, region?: UserRegion) => Promise<AuthenticatedUser>; // Region optional for login
  signup: (email: string, password_provided: string, username: string, region: UserRegion) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AuthenticatedUser, 'displayName' | 'photoURL' | 'bannerURL' | 'walletBalance' | 'region'>>) => Promise<AuthenticatedUser | null>;
  completeRegionSelection: () => void; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_SESSION_STORAGE_KEY = 'arenaClashCurrentUser_session_v3_local';
const ADMIN_EMAIL = 'admin@example.com';

const defaultContextValue: AuthContextType = {
  user: null,
  loading: true, 
  isLoggedIn: false,
  isAdmin: false,
  authError: null,
  promptRegionSelection: false,
  login: async () => { throw new Error("Auth context not fully initialized for login."); },
  signup: async () => { throw new Error("Auth context not fully initialized for signup."); },
  logout: async () => { throw new Error("Auth context not fully initialized for logout."); },
  updateUserProfile: async () => {throw new Error("Auth context not fully initialized for profile update.")},
  completeRegionSelection: () => { console.warn("Auth context not fully initialized for completeRegionSelection."); }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(defaultContextValue.user);
  const [loading, setLoading] = useState(defaultContextValue.loading);
  const [authError, setAuthError] = useState<string | null>(defaultContextValue.authError);
  const [promptRegionSelection, setPromptRegionSelection] = useState(false);
  const [isClientHydrated, setIsClientHydrated] = useState(false);

  useEffect(() => {
    setIsClientHydrated(true);
  }, []);
  
  const checkAndPromptRegion = useCallback((currentUser: AuthenticatedUser | null) => {
    if (currentUser && !currentUser.isAdmin && currentUser.region !== 'INDIA' && currentUser.region !== 'USA') {
      setPromptRegionSelection(true);
    } else {
      setPromptRegionSelection(false);
    }
  }, []);

  useEffect(() => {
    if (!isClientHydrated) return; 
    if (firebaseInitialized) {
      console.warn("Firebase is marked as initialized, but AuthProvider is set up for local storage auth.")
      setLoading(false); 
      return; 
    }
    
    let isMounted = true;
    setLoading(true);
    
    const initializeLocalAuth = async () => {
      try {
        const storedUserJson = localStorage.getItem(CURRENT_USER_SESSION_STORAGE_KEY);
        if (storedUserJson) {
          const storedUserSession = JSON.parse(storedUserJson) as AuthenticatedUser;
          const actualUserRecord = await getUserByEmail(storedUserSession.email);
          
          if (actualUserRecord && actualUserRecord.uid === storedUserSession.uid) {
            if (isMounted) {
              const { password_local_file, ...userToSet } = actualUserRecord;
              const fullUserToSet = {
                ...userToSet,
                isAdmin: userToSet.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
                walletBalance: userToSet.walletBalance || { winnings: 0, credits: 0 },
                region: userToSet.region || 'USA' 
              };
              setUser(fullUserToSet);
              checkAndPromptRegion(fullUserToSet);
            }
          } else {
            localStorage.removeItem(CURRENT_USER_SESSION_STORAGE_KEY);
            if (isMounted) setUser(null);
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (error) {
        console.error("Error initializing local user session:", error);
        localStorage.removeItem(CURRENT_USER_SESSION_STORAGE_KEY);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeLocalAuth();
    return () => { isMounted = false; };
  }, [isClientHydrated, checkAndPromptRegion]); 


  const login = useCallback(async (emailInput: string, password_provided: string, regionInput?: UserRegion): Promise<AuthenticatedUser> => {
    if (firebaseInitialized) throw new Error("Firebase login not implemented in local auth mode.");
    setLoading(true);
    setAuthError(null);
    
    try {
      const normalizedEmail = emailInput.toLowerCase();
      const userRecord = await getUserByEmail(normalizedEmail);

      if (userRecord && userRecord.password_local_file === password_provided) {
        const { password_local_file, ...userToReturn } = userRecord;
        const userWithWalletAndRegion = {
          ...userToReturn,
          isAdmin: userToReturn.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
          walletBalance: userToReturn.walletBalance || { winnings: 0, credits: 0 },
          region: regionInput || userToReturn.region || 'USA' // Prioritize login region, then stored, then default
        };
        
        if (regionInput && regionInput !== userRecord.region) {
            await updateUser(userRecord.uid, { region: regionInput });
            userWithWalletAndRegion.region = regionInput;
        }

        localStorage.setItem(CURRENT_USER_SESSION_STORAGE_KEY, JSON.stringify(userWithWalletAndRegion));
        setUser(userWithWalletAndRegion);
        setAuthError(null);
        checkAndPromptRegion(userWithWalletAndRegion);
        return userWithWalletAndRegion;
      } else {
        throw new Error('Invalid email or password.');
      }
    } catch (err: any) {
      setAuthError(err.message);
      setUser(null);
      localStorage.removeItem(CURRENT_USER_SESSION_STORAGE_KEY);
      throw err; 
    } finally {
      setLoading(false);
    }
  }, [checkAndPromptRegion]);

  const signup = useCallback(async (emailInput: string, password_provided: string, username: string, region: UserRegion): Promise<AuthenticatedUser> => {
    if (firebaseInitialized) throw new Error("Firebase signup not implemented in local auth mode.");
    
    if (emailInput.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        throw new Error(`Cannot sign up with the admin email address (${ADMIN_EMAIL}). Please use the admin login page.`);
    }

    setLoading(true);
    setAuthError(null);

    try {
      const normalizedEmail = emailInput.toLowerCase();
      const existingUser = await getUserByEmail(normalizedEmail);

      if (existingUser) {
        throw new Error('Email already in use.');
      }
      
      const createUserData: CreateUserData = {
        email: normalizedEmail,
        password_local_file: password_provided,
        displayName: username,
        photoURL: null, 
        bannerURL: null,
        region: region,
      };
      const newUserRecord = await addUser(createUserData);

      const { password_local_file, ...userToReturn } = newUserRecord;
       const userWithWalletAndRegion = {
          ...userToReturn,
          isAdmin: userToReturn.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
          walletBalance: userToReturn.walletBalance || { winnings: 0, credits: 0 },
          region: newUserRecord.region
        };
      localStorage.setItem(CURRENT_USER_SESSION_STORAGE_KEY, JSON.stringify(userWithWalletAndRegion)); 
      setUser(userWithWalletAndRegion);
      setAuthError(null);
      checkAndPromptRegion(userWithWalletAndRegion); // New users will have region, so modal won't show.
      return userWithWalletAndRegion;
    } catch (err: any) {
      setAuthError(err.message);
      setUser(null);
      localStorage.removeItem(CURRENT_USER_SESSION_STORAGE_KEY);
      throw err; 
    } finally {
      setLoading(false);
    }
  }, [checkAndPromptRegion]);

  const logout = useCallback(async (): Promise<void> => {
    if (firebaseInitialized) throw new Error("Firebase logout not implemented in local auth mode.");
    localStorage.removeItem(CURRENT_USER_SESSION_STORAGE_KEY);
    setUser(null);
    setAuthError(null);
    setPromptRegionSelection(false);
  }, []);

  const updateUserProfile = useCallback(async (updates: Partial<Pick<AuthenticatedUser, 'displayName' | 'photoURL' | 'bannerURL' | 'walletBalance' | 'region'>>): Promise<AuthenticatedUser | null> => {
    if (!user) {
      setAuthError("No user logged in to update.");
      return null;
    }
    if (firebaseInitialized) throw new Error("Firebase profile update not implemented in local auth mode.");

    setLoading(true);
    setAuthError(null);
    try {
      const currentWallet = user.walletBalance || { winnings: 0, credits: 0 };
      const updatedWallet = updates.walletBalance 
        ? { ...currentWallet, ...updates.walletBalance }
        : currentWallet;
      
      const currentRegion = user.region || 'USA';
      const updatedRegion = updates.region || currentRegion;

      const finalUpdates = { ...updates, walletBalance: updatedWallet, region: updatedRegion };

      const updatedUserRecord = await updateUser(user.uid, finalUpdates);
      if (updatedUserRecord) {
        const { password_local_file, ...userToSet } = updatedUserRecord;
         const userWithWalletAndRegion = {
          ...userToSet,
          isAdmin: userToSet.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
          walletBalance: userToSet.walletBalance || { winnings: 0, credits: 0 },
          region: userToSet.region || 'USA'
        };
        setUser(userWithWalletAndRegion); 
        localStorage.setItem(CURRENT_USER_SESSION_STORAGE_KEY, JSON.stringify(userWithWalletAndRegion)); 
        checkAndPromptRegion(userWithWalletAndRegion); // Re-check after profile update
        return userWithWalletAndRegion;
      } else {
        throw new Error("Failed to update user profile in the data store.");
      }
    } catch (err: any) {
      setAuthError(err.message);
      console.error("Error updating profile:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, checkAndPromptRegion]);

  const completeRegionSelection = useCallback(() => {
    setPromptRegionSelection(false);
  }, []);

  const isLoggedIn = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(() => user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(), [user]);

  const contextValue = useMemo(() => ({
    user,
    loading,
    isLoggedIn,
    isAdmin,
    authError,
    promptRegionSelection,
    login,
    signup,
    logout,
    updateUserProfile,
    completeRegionSelection,
  }), [user, loading, isLoggedIn, isAdmin, authError, promptRegionSelection, login, signup, logout, updateUserProfile, completeRegionSelection]);

  if (!isClientHydrated && typeof window === 'undefined') {
    // Still on server, return basic provider or null children
    return <AuthContext.Provider value={defaultContextValue}>{children}</AuthContext.Provider>;
  }
  
  if (loading && isClientHydrated) { // Show spinner only on client after hydration and if loading
    return (
      <AuthContext.Provider value={contextValue}>
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Spinner size="large" />
        </div>
      </AuthContext.Provider>
    );
  }
  

  return (
    <AuthContext.Provider value={contextValue}>
      {authError && !loading && isClientHydrated && ( 
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 bg-destructive/90 text-destructive-foreground rounded-md shadow-lg flex items-center max-w-md animate-in fade-in slide-in-from-top-5 duration-300">
              <AlertTriangle className="mr-3 h-5 w-5" />
              <span>{authError}</span>
            </div>
          )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
