// src/data/users.ts
'use server';

import { writeDataToFile, readDataFromFile } from '@/lib/localFileStore';

export type UserRegion = 'USA' | 'INDIA';

export interface WalletBalance {
  winnings: number;
  credits: number;
}
export interface UserRecord {
  uid: string;
  email: string;
  password_local_file: string;
  displayName?: string | null;
  photoURL?: string | null;
  bannerURL?: string | null;
  createdAt: number;
  walletBalance: WalletBalance;
  region: UserRegion;
}

export type CreateUserData = Pick<UserRecord, 'email' | 'password_local_file' | 'displayName' | 'region'> & {
  photoURL?: string | null;
  bannerURL?: string | null;
};

const USERS_FILE = 'users.json';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password';

const getUsersFromFile = async (): Promise<UserRecord[]> => {
  const users = await readDataFromFile<UserRecord[]>(USERS_FILE, []);
  return users.map(user => ({
    ...user,
    walletBalance: user.walletBalance || { winnings: 0, credits: 0 },
    region: (user.region === 'INDIA' || user.region === 'USA') ? user.region : 'USA',
  }));
};

const saveUsersToFile = async (users: UserRecord[]): Promise<boolean> => {
  return await writeDataToFile(USERS_FILE, users);
};

const generateNumericUserId = (currentUsers: UserRecord[]): string => {
  let maxUid = 0;
  currentUsers.forEach(user => {
    const numericUid = parseInt(user.uid, 10);
    if (!isNaN(numericUid) && numericUid > maxUid) {
      maxUid = numericUid;
    }
  });
  // Ensure it's a 9-digit number, padding with leading zeros if needed,
  // but starting from maxUid + 1 should generally keep it large enough.
  // The first digit won't necessarily be 1-9, could be 0 if maxUid is small.
  // Let's make it simple: highest existing UID + 1, then ensure it's 9 digits.
  // This needs a rethink if UIDs aren't purely numeric or if starting from scratch.
  // For now, this simplified numeric ID generation focuses on incrementing.
  
  // A safer approach for truly unique 9-digit numeric IDs starting 1-9:
  let attempts = 0;
  const existingUids = new Set(currentUsers.map(u => u.uid));
  while(attempts < 1000) { // Limit attempts to avoid infinite loop
      const firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9
      const restOfDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0'); // 8 digits
      const newUid = `${firstDigit}${restOfDigits}`;
      if (!existingUids.has(newUid)) {
          return newUid;
      }
      attempts++;
  }
  // Fallback if unique 9-digit ID generation fails multiple times (highly unlikely with 9 digits)
  return `fallback-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
};


const ensureAdminUserExists = async (): Promise<void> => {
  let users = await getUsersFromFile();
  const adminExists = users.some(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!adminExists) {
    console.log(`Admin user ${ADMIN_EMAIL} not found. Creating...`);
    const adminData: CreateUserData = {
      email: ADMIN_EMAIL,
      password_local_file: ADMIN_PASSWORD,
      displayName: 'Arena Admin',
      photoURL: null,
      bannerURL: null,
      region: 'USA', 
    };
    const adminUser: UserRecord = {
      uid: generateNumericUserId(users),
      ...adminData,
      createdAt: Date.now(),
      walletBalance: { winnings: 0, credits: 0 },
    };
    users.push(adminUser);
    const success = await saveUsersToFile(users);
    if (success) {
      console.log(`Admin user ${ADMIN_EMAIL} created successfully with UID: ${adminUser.uid}`);
    } else {
      console.error(`Failed to save newly created admin user ${ADMIN_EMAIL}.`);
    }
  } else {
     const adminIndex = users.findIndex(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (adminIndex !== -1 && (users[adminIndex].region !== 'USA' && users[adminIndex].region !== 'INDIA')) {
      users[adminIndex].region = 'USA'; 
      await saveUsersToFile(users);
    }
  }
};

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  ensureAdminUserExists().catch(error => {
    console.error("Failed to ensure admin user exists on server startup:", error);
  });
}


export const getAllUsers = async (filterRegion?: UserRegion): Promise<UserRecord[]> => {
  let users = await getUsersFromFile();
  if (filterRegion) {
    users = users.filter(user => user.region === filterRegion);
  }
  return JSON.parse(JSON.stringify(users));
};

export const getUserByEmail = async (email: string): Promise<UserRecord | null> => {
  const users = await getUsersFromFile();
  const normalizedEmail = email.toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  return user ? JSON.parse(JSON.stringify(user)) : null;
};

export const getUserById = async (uid: string): Promise<UserRecord | null> => {
  const users = await getUsersFromFile();
  const user = users.find(u => u.uid === uid);
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

export const addUser = async (userData: CreateUserData): Promise<UserRecord> => {
  let users = await getUsersFromFile();
  const normalizedEmail = userData.email.toLowerCase();

  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Email already in use.');
  }

  const newUser: UserRecord = {
    uid: generateNumericUserId(users),
    email: normalizedEmail,
    password_local_file: userData.password_local_file,
    displayName: userData.displayName || normalizedEmail.split('@')[0],
    photoURL: userData.photoURL || `https://avatar.vercel.sh/${(userData.displayName || normalizedEmail.split('@')[0]).replace(/\s+/g, '')}?size=100&text=${(userData.displayName || normalizedEmail.split('@')[0])[0].toUpperCase()}`,
    bannerURL: userData.bannerURL || null,
    createdAt: Date.now(),
    walletBalance: { winnings: 0, credits: 0 },
    region: userData.region, 
  };

  users.push(newUser);
  const success = await saveUsersToFile(users);
  if (!success) {
    throw new Error("Failed to save new user to file.");
  }
  return JSON.parse(JSON.stringify(newUser));
};

export const updateUser = async (uid: string, updates: Partial<Omit<UserRecord, 'uid' | 'password_local_file' | 'email'>>): Promise<UserRecord | null> => {
  let users = await getUsersFromFile();
  const userIndex = users.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    console.warn(`User with UID ${uid} not found for update.`);
    return null;
  }

  const existingUser = { ...users[userIndex] }; // Create a shallow copy
  
  let updatedWallet = { ...(existingUser.walletBalance || { winnings: 0, credits: 0 }) };
  if (updates.walletBalance) {
    if (updates.walletBalance.hasOwnProperty('winnings')) {
      updatedWallet.winnings = updates.walletBalance.winnings;
    }
    if (updates.walletBalance.hasOwnProperty('credits')) {
      updatedWallet.credits = updates.walletBalance.credits;
    }
  }
  
  const currentRegion = (existingUser.region === 'INDIA' || existingUser.region === 'USA') ? existingUser.region : 'USA';
  let updatedRegion = updates.region || currentRegion;
  if (updatedRegion !== 'INDIA' && updatedRegion !== 'USA') {
    updatedRegion = 'USA'; 
  }

  users[userIndex] = {
    ...existingUser,
    ...updates,
    walletBalance: updatedWallet,
    region: updatedRegion,
    createdAt: existingUser.createdAt, 
  };

  const success = await saveUsersToFile(users);
  if (!success) {
    throw new Error(`Failed to save updates for user ${uid} to file.`);
  }

  const { password_local_file, ...updatedUserToReturn } = users[userIndex];
  return JSON.parse(JSON.stringify(updatedUserToReturn));
};


export const resetAllUsers_ONLY_FOR_TESTING = async (): Promise<void> => {
  await writeDataToFile(USERS_FILE, []); 
  await ensureAdminUserExists(); 
  console.log("All users (except recreated admin) have been removed for testing.");
};
