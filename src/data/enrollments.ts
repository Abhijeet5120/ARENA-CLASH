// src/data/enrollments.ts
'use server';

import { writeDataToFile, readDataFromFile } from '@/lib/localFileStore';

export interface Enrollment {
  id: string;
  tournamentId: string;
  tournamentName: string; 
  gameId: string; 
  userId: string;
  userEmail: string; 
  inGameName: string;
  enrollmentDate: string; // ISO string
}

export type CreateEnrollmentData = Omit<Enrollment, 'id' | 'enrollmentDate'>;

const ENROLLMENTS_FILE = 'enrollments.json';

const generateLocalId = () => `enrollment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// --- Data Access Functions ---

export const getAllEnrollments = async (): Promise<Enrollment[]> => {
  const currentStore = await readDataFromFile<Enrollment[]>(ENROLLMENTS_FILE, []);
  return JSON.parse(JSON.stringify(currentStore));
};

export const getEnrollmentsByTournamentId = async (tournamentId: string): Promise<Enrollment[]> => {
  const currentStore = await readDataFromFile<Enrollment[]>(ENROLLMENTS_FILE, []);
  const filtered = currentStore.filter(e => e.tournamentId === tournamentId);
  return JSON.parse(JSON.stringify(filtered));
};

export const getEnrollmentsByUserId = async (userId: string): Promise<Enrollment[]> => {
  const currentStore = await readDataFromFile<Enrollment[]>(ENROLLMENTS_FILE, []);
  const filtered = currentStore.filter(e => e.userId === userId);
  return JSON.parse(JSON.stringify(filtered));
};

export const getEnrollmentById = async (id: string): Promise<Enrollment | null> => {
  const currentStore = await readDataFromFile<Enrollment[]>(ENROLLMENTS_FILE, []);
  const enrollment = currentStore.find(e => e.id === id);
  return enrollment ? JSON.parse(JSON.stringify(enrollment)) : null;
};

export const hasUserEnrolled = async (userId: string, tournamentId: string): Promise<boolean> => {
  const currentStore = await readDataFromFile<Enrollment[]>(ENROLLMENTS_FILE, []);
  return currentStore.some(e => e.userId === userId && e.tournamentId === tournamentId);
};

// --- Data Modification Functions ---

export const addEnrollment = async (enrollmentDetails: CreateEnrollmentData): Promise<Enrollment> => {
  let currentStore = await readDataFromFile<Enrollment[]>(ENROLLMENTS_FILE, []);

  if (await hasUserEnrolled(enrollmentDetails.userId, enrollmentDetails.tournamentId)) {
    console.warn(`User ${enrollmentDetails.userId} already enrolled in tournament ${enrollmentDetails.tournamentId}`);
    throw new Error('User is already enrolled in this tournament.');
  }

  const newEnrollment: Enrollment = {
    id: generateLocalId(),
    ...enrollmentDetails,
    enrollmentDate: new Date().toISOString(),
  };

  currentStore.push(newEnrollment);
  const success = await writeDataToFile(ENROLLMENTS_FILE, currentStore);
  if (!success) {
    throw new Error("Failed to save new enrollment to file.");
  }
  return JSON.parse(JSON.stringify(newEnrollment));
};

export const updateEnrollment = async (id: string, updates: Partial<Omit<Enrollment, 'id'>>): Promise<Enrollment | undefined> => {
  let currentStore = await readDataFromFile<Enrollment[]>(ENROLLMENTS_FILE, []);
  const enrollmentIndex = currentStore.findIndex(e => e.id === id);
  if (enrollmentIndex > -1) {
    currentStore[enrollmentIndex] = { ...currentStore[enrollmentIndex], ...updates };
    const success = await writeDataToFile(ENROLLMENTS_FILE, currentStore);
     if (!success) {
      throw new Error(`Failed to save updates for enrollment ${id} to file.`);
    }
    return JSON.parse(JSON.stringify(currentStore[enrollmentIndex]));
  }
  return undefined;
};

export const deleteEnrollment = async (id: string): Promise<boolean> => {
  let currentStore = await readDataFromFile<Enrollment[]>(ENROLLMENTS_FILE, []);
  const initialLength = currentStore.length;
  currentStore = currentStore.filter(e => e.id !== id);
  if (currentStore.length < initialLength) {
    const success = await writeDataToFile(ENROLLMENTS_FILE, currentStore);
    return success;
  }
  return false;
};

export const resetAllEnrollments_ONLY_FOR_TESTING = async (): Promise<void> => {
  await writeDataToFile(ENROLLMENTS_FILE, []);
  console.log('All enrollments have been reset (local file store).');
};
