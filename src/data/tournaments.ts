// src/data/tournaments.ts
'use server';

import { writeDataToFile, readDataFromFile } from '@/lib/localFileStore';
import type { UserRegion } from './users';

export interface Tournament {
  id: string;
  gameId: string;
  name: string;
  tournamentDate: string; // ISO string format
  registrationCloseDate: string; // ISO string format
  entryFee: number;
  entryFeeCurrency: 'USD' | 'INR';
  prizePool: string;
  imageUrl: string;
  spotsLeft: number;
  totalSpots: number;
  dataAiHint?: string; // Made optional
  region: UserRegion; // Region for which this tournament is intended
  gameModeId: string;
  isSpecial: boolean;
}

const TOURNAMENTS_FILE = 'tournaments.json';

// Helper to ensure default values for new fields
const ensureTournamentDefaults = (tournament: any): Tournament => ({
  ...tournament,
  gameModeId: tournament.gameModeId || 'default', // Default if somehow missing
  isSpecial: tournament.isSpecial === undefined ? false : tournament.isSpecial,
  dataAiHint: tournament.dataAiHint || `${tournament.name.split(" ")[0]} ${tournament.gameId.split('-')[0] || 'game'}`.toLowerCase().slice(0,50),
  imageUrl: tournament.imageUrl || `https://placehold.co/400x250.png`,
});


const getStore = async (): Promise<Tournament[]> => {
  const store = await readDataFromFile<Tournament[]>(TOURNAMENTS_FILE, []);
  return store.map(ensureTournamentDefaults);
};

const saveStore = async (store: Tournament[]): Promise<boolean> => {
  return await writeDataToFile(TOURNAMENTS_FILE, store.map(ensureTournamentDefaults));
};

const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// --- Data Access Functions ---

export const getAllTournaments = async (filterRegion?: UserRegion): Promise<Tournament[]> => {
  let store = await getStore();
  if (filterRegion) {
    store = store.filter(t => t.region === filterRegion);
  }
  return JSON.parse(JSON.stringify(store));
};

export const getTournamentsByGameId = async (
  gameId: string,
  filterRegion?: UserRegion,
  filterGameModeId?: string
): Promise<Tournament[]> => {
  let store = await getStore();
  let filtered = store.filter(t => t.gameId === gameId && t.isSpecial === false); // Default to non-special tournaments
  if (filterRegion) {
    filtered = filtered.filter(t => t.region === filterRegion);
  }
  if (filterGameModeId) {
    filtered = filtered.filter(t => t.gameModeId === filterGameModeId);
  }
  return JSON.parse(JSON.stringify(filtered.sort((a, b) => new Date(a.tournamentDate).getTime() - new Date(b.tournamentDate).getTime())));
};

export const getSpecialTournamentsByGameId = async (gameId: string, filterRegion?: UserRegion): Promise<Tournament[]> => {
  let store = await getStore();
  let filtered = store.filter(t => t.gameId === gameId && t.isSpecial === true);
  if (filterRegion) {
    filtered = filtered.filter(t => t.region === filterRegion);
  }
  return JSON.parse(JSON.stringify(filtered.sort((a, b) => new Date(a.tournamentDate).getTime() - new Date(b.tournamentDate).getTime())));
};


export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  const store = await getStore();
  const tournament = store.find(t => t.id === id);
  return tournament ? JSON.parse(JSON.stringify(tournament)) : null;
};

// --- Data Modification Functions ---

export type CreateTournamentData = Omit<Tournament, 'id' | 'spotsLeft'>;

export const addTournament = async (tournamentDetails: CreateTournamentData): Promise<Tournament> => {
  let currentStore = await getStore();
  const newId = generateLocalId();
  const gameNameForHint = tournamentDetails.gameId.split('-')[0] || 'game';

  const newTournament: Tournament = {
    id: newId,
    name: tournamentDetails.name,
    gameId: tournamentDetails.gameId,
    tournamentDate: tournamentDetails.tournamentDate,
    registrationCloseDate: tournamentDetails.registrationCloseDate,
    entryFee: tournamentDetails.entryFee,
    entryFeeCurrency: tournamentDetails.entryFeeCurrency,
    region: tournamentDetails.region,
    prizePool: tournamentDetails.prizePool,
    totalSpots: tournamentDetails.totalSpots,
    spotsLeft: tournamentDetails.totalSpots,
    imageUrl: tournamentDetails.imageUrl || `https://placehold.co/400x250.png`,
    dataAiHint: tournamentDetails.dataAiHint || `${tournamentDetails.name.split(" ")[0]} ${gameNameForHint}`.toLowerCase().slice(0, 50),
    gameModeId: tournamentDetails.gameModeId, 
    isSpecial: tournamentDetails.isSpecial,    
  };

  currentStore.push(newTournament);
  const success = await saveStore(currentStore);
  if (!success) {
    throw new Error("Failed to save new tournament to file.");
  }
  return JSON.parse(JSON.stringify(newTournament));
};

export type UpdateTournamentData = Partial<Omit<Tournament, 'id' | 'gameId'>>;

export const updateTournament = async (id: string, updates: UpdateTournamentData): Promise<Tournament | undefined> => {
  let currentStore = await getStore();
  const tournamentIndex = currentStore.findIndex(t => t.id === id);

  if (tournamentIndex > -1) {
    const originalTournament = currentStore[tournamentIndex];
    
    let updatedTournamentData: Tournament = { ...originalTournament };

    for (const key in updates) {
        if (updates.hasOwnProperty(key as keyof UpdateTournamentData)) {
            const typedKey = key as keyof UpdateTournamentData;
            if (typedKey === 'tournamentDate' || typedKey === 'registrationCloseDate') {
                const dateValue = updates[typedKey];
                (updatedTournamentData as any)[typedKey] = dateValue instanceof Date ? dateValue.toISOString() : dateValue as string;
            } else if (typedKey === 'region') {
                 const regionValue = updates[typedKey] as UserRegion | undefined;
                 if (regionValue && (regionValue === 'USA' || regionValue === 'INDIA')) {
                     updatedTournamentData.region = regionValue;
                 }
            }
            else {
                (updatedTournamentData as any)[typedKey] = updates[typedKey];
            }
        }
    }

    if (updates.totalSpots !== undefined && updates.totalSpots !== originalTournament.totalSpots) {
      const spotsTaken = originalTournament.totalSpots - originalTournament.spotsLeft;
      updatedTournamentData.spotsLeft = Math.max(0, updates.totalSpots - spotsTaken);
    }
    
    if (updates.hasOwnProperty('imageUrl')) {
        updatedTournamentData.imageUrl = updates.imageUrl || `https://placehold.co/400x250.png`;
    }

    if (updates.hasOwnProperty('dataAiHint')) {
        updatedTournamentData.dataAiHint = updates.dataAiHint || originalTournament.dataAiHint;
    }
    
    if (updates.hasOwnProperty('gameModeId')) {
        updatedTournamentData.gameModeId = updates.gameModeId!;
    }
    if (updates.hasOwnProperty('isSpecial')) {
        updatedTournamentData.isSpecial = updates.isSpecial!;
    }

    currentStore[tournamentIndex] = ensureTournamentDefaults(updatedTournamentData); 
    const success = await saveStore(currentStore);
    if (!success) {
      throw new Error(`Failed to save updates for tournament ${id} to file.`);
    }
    return JSON.parse(JSON.stringify(currentStore[tournamentIndex]));
  }
  console.warn(`Tournament with id ${id} not found for update.`);
  return undefined;
};

export const deleteTournament = async (id: string): Promise<boolean> => {
  let currentStore = await getStore();
  const initialLength = currentStore.length;
  currentStore = currentStore.filter(t => t.id !== id);
  const success = currentStore.length < initialLength;
  if (success) {
    const writeSuccess = await saveStore(currentStore);
    if (!writeSuccess) {
        console.error(`Failed to write to file after deleting tournament ${id} in memory.`);
        throw new Error(`Failed to persist deletion of tournament ${id}.`);
    }
  }
  return success;
};

export const enrollInTournament = async (tournamentId: string): Promise<Tournament | null> => {
  let currentStore = await getStore();
  const tournamentIndex = currentStore.findIndex(t => t.id === tournamentId);

  if (tournamentIndex > -1) {
    const tournament = { ...currentStore[tournamentIndex] };
    if (tournament.spotsLeft > 0) {
      tournament.spotsLeft -= 1;
      currentStore[tournamentIndex] = tournament;
      const success = await saveStore(currentStore);
      if (!success) {
          console.error(`Failed to save spot deduction for tournament ${tournamentId}. Spot not deducted.`);
          throw new Error(`Failed to save spot deduction for tournament ${tournamentId}.`);
      }
      return JSON.parse(JSON.stringify(tournament));
    } else {
      console.warn(`Enrollment failed for ${tournamentId}: No spots left.`);
      return null;
    }
  }
  console.warn(`Enrollment failed: Tournament ${tournamentId} not found.`);
  return null;
};

export const incrementSpotInTournament = async (tournamentId: string): Promise<Tournament | null> => {
  let currentStore = await getStore();
  const tournamentIndex = currentStore.findIndex(t => t.id === tournamentId);

  if (tournamentIndex > -1) {
    const tournament = { ...currentStore[tournamentIndex] };
    if (tournament.spotsLeft < tournament.totalSpots) {
      tournament.spotsLeft += 1;
      currentStore[tournamentIndex] = tournament;
      const success = await saveStore(currentStore);
      if(!success) {
        console.error(`Failed to save spot increment for tournament ${tournamentId}. Spot not incremented.`);
        throw new Error(`Failed to save spot increment for tournament ${tournamentId}.`);
      }
      return JSON.parse(JSON.stringify(tournament));
    } else {
      console.warn(`Could not increment spot for ${tournamentId}: Already at max capacity or error.`);
      return JSON.parse(JSON.stringify(tournament));
    }
  }
  console.warn(`Increment spot failed: Tournament ${tournamentId} not found.`);
  return null;
};

export const resetAllTournaments_ONLY_FOR_TESTING = async (): Promise<void> => {
  const success = await saveStore([]);
  if (success) {
    console.log('All tournaments have been reset (local file store cleared).');
  } else {
    console.error('Failed to reset tournaments file.');
  }
};
