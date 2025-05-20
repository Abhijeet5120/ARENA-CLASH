// src/data/games.ts
'use server';

import { readDataFromFile, writeDataToFile } from '@/lib/localFileStore';

export interface GameMode {
  id: string;
  name: string;
  description?: string;
  iconImageUrl?: string;
  bannerImageUrl?: string;
}

export interface DailyTournamentTemplate {
  id: string; // Unique ID for the template
  templateName: string; // e.g., "Morning Free Fire CS 1v1"
  gameModeId: string; // From the game's available gameModes
  entryFee: number;
  prizePool: string;
  imageUrl?: string; // Banner for this template
  totalSpots: number;
  tournamentTime: string; // HH:mm, e.g., "10:00"
  registrationCloseOffsetHours: number; // How many hours before tournamentTime registration closes
}

export interface Game {
  id: string;
  name: string;
  description: string;
  iconImageUrl?: string;
  imageUrl: string;
  bannerImageUrl: string;
  themeGradient: string;
  dataAiHint: string;
  frequentlyUsedBanners: string[];
  gameModes: GameMode[];
  dailyTournamentTemplates?: DailyTournamentTemplate[];
}

export type CreateGameData = Pick<Game, 'id' | 'name' | 'description'> & {
  iconImageUrl?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  themeGradient?: string;
  dataAiHint?: string;
};

const GAMES_FILE = 'games.json';
let gamesStore: Game[] = []; // In-memory cache

const initialGamesData: Omit<Game, 'frequentlyUsedBanners' | 'iconImageUrl' | 'gameModes' | 'dailyTournamentTemplates'>[] = [
  {
    id: 'minecraft',
    name: 'Minecraft',
    description: 'Build, mine, and explore infinite worlds of blocks and adventure.',
    imageUrl: 'https://placehold.co/300x200.png',
    bannerImageUrl: 'https://placehold.co/1200x400.png',
    themeGradient: 'from-green-500 to-emerald-600',
    dataAiHint: 'minecraft game world',
  },
  {
    id: 'free-fire',
    name: 'Free Fire',
    description: 'Experience the ultimate survival shooter on mobile. Be the last one standing!',
    imageUrl: 'https://placehold.co/300x200.png',
    bannerImageUrl: 'https://placehold.co/1200x400.png',
    themeGradient: 'from-orange-500 to-red-600',
    dataAiHint: 'battle royale shooter',
  },
];

const defaultFreeFireGameModes: GameMode[] = [
  { id: 'cs-1v1', name: 'Clash Squad 1v1', description: 'Intense 1v1 battles in a small zone.', iconImageUrl: 'https://placehold.co/40x40.png?text=1v1', bannerImageUrl: 'https://placehold.co/300x160.png?text=CS+1v1' },
  { id: 'cs-2v2', name: 'Clash Squad 2v2', description: 'Team up for 2v2 tactical combat.', iconImageUrl: 'https://placehold.co/40x40.png?text=2v2', bannerImageUrl: 'https://placehold.co/300x160.png?text=CS+2v2'},
  { id: 'cs-4v4', name: 'Clash Squad 4v4', description: 'Classic 4v4 squad-based rounds.', iconImageUrl: 'https://placehold.co/40x40.png?text=4v4', bannerImageUrl: 'https://placehold.co/300x160.png?text=CS+4v4'},
  { id: 'fm-solo', name: 'Full Map Solo', description: 'Survive alone on the vast island.', iconImageUrl: 'https://placehold.co/40x40.png?text=Solo', bannerImageUrl: 'https://placehold.co/300x160.png?text=Solo+Map'},
  { id: 'fm-duo', name: 'Full Map Duo', description: 'Partner up and fight for victory.', iconImageUrl: 'https://placehold.co/40x40.png?text=Duo', bannerImageUrl: 'https://placehold.co/300x160.png?text=Duo+Map'},
  { id: 'fm-squad', name: 'Full Map Squad', description: 'Coordinate with your squad to win.', iconImageUrl: 'https://placehold.co/40x40.png?text=Sqd', bannerImageUrl: 'https://placehold.co/300x160.png?text=Squad+Map'},
  { id: 'lw-1v1', name: 'Lone Wolf 1v1', description: 'Fast-paced 1v1 duels with preset loadouts.', iconImageUrl: 'https://placehold.co/40x40.png?text=LW1', bannerImageUrl: 'https://placehold.co/300x160.png?text=LW+1v1'},
  { id: 'lw-2v2', name: 'Lone Wolf 2v2', description: '2v2 action with preset weapon choices.', iconImageUrl: 'https://placehold.co/40x40.png?text=LW2', bannerImageUrl: 'https://placehold.co/300x160.png?text=LW+2v2'},
];

const defaultMinecraftGameModes: GameMode[] = [
    { id: 'survival', name: 'Survival', description: 'Gather resources, build, and survive.', iconImageUrl: 'https://placehold.co/40x40.png?text=Surv', bannerImageUrl: 'https://placehold.co/300x160.png?text=MC+Survival' },
    { id: 'creative', name: 'Creative', description: 'Unlimited resources to build anything.', iconImageUrl: 'https://placehold.co/40x40.png?text=Crea', bannerImageUrl: 'https://placehold.co/300x160.png?text=MC+Creative' },
    { id: 'bed-wars', name: 'Bed Wars', description: 'Protect your bed and destroy others.', iconImageUrl: 'https://placehold.co/40x40.png?text=BedW', bannerImageUrl: 'https://placehold.co/300x160.png?text=MC+BedWars' },
];

const getStore = async (): Promise<Game[]> => {
  let fileData = await readDataFromFile<Game[]>(GAMES_FILE, []);
  if (fileData.length === 0 && initialGamesData.length > 0 && process.env.NODE_ENV !== 'test') {
    console.log("Games.json is empty or not found, seeding with initial game data...");
    const seededGames = initialGamesData.map(g => ({
      ...g,
      iconImageUrl: g.iconImageUrl || `https://placehold.co/100x100.png?text=${g.name.charAt(0)}`,
      frequentlyUsedBanners: [],
      gameModes: g.id === 'free-fire' ? defaultFreeFireGameModes : (g.id === 'minecraft' ? defaultMinecraftGameModes : []),
      dailyTournamentTemplates: [],
    }));
    const success = await writeDataToFile(GAMES_FILE, seededGames);
    if (success) {
      fileData = [...seededGames];
    } else {
      console.error("Failed to seed games.json, using initial data in memory for this request.");
      fileData = [...initialGamesData.map(g => ({
        ...g,
        iconImageUrl: g.iconImageUrl || `https://placehold.co/100x100.png?text=${g.name.charAt(0)}`,
        frequentlyUsedBanners: [],
        gameModes: g.id === 'free-fire' ? defaultFreeFireGameModes : (g.id === 'minecraft' ? defaultMinecraftGameModes : []),
        dailyTournamentTemplates: [],
      }))];
    }
  }
  return fileData.map(g => {
    const defaultModes = g.id === 'free-fire' ? defaultFreeFireGameModes : (g.id === 'minecraft' ? defaultMinecraftGameModes : []);
    return {
        ...g,
        iconImageUrl: g.iconImageUrl || `https://placehold.co/100x100.png?text=${g.name.charAt(0)}`,
        imageUrl: g.imageUrl || `https://placehold.co/300x200.png`,
        bannerImageUrl: g.bannerImageUrl || `https://placehold.co/1200x400.png`,
        frequentlyUsedBanners: g.frequentlyUsedBanners || [],
        gameModes: (g.gameModes && g.gameModes.length > 0 ? g.gameModes : defaultModes).map(gm => ({
            ...gm,
            iconImageUrl: gm.iconImageUrl || `https://placehold.co/40x40.png?text=${gm.name.charAt(0)}`,
            bannerImageUrl: gm.bannerImageUrl || `https://placehold.co/300x160.png`
        })),
        dailyTournamentTemplates: g.dailyTournamentTemplates || [],
    };
  });
};

const saveStore = async (store: Game[]): Promise<boolean> => {
  const success = await writeDataToFile(GAMES_FILE, store);
  if (success) {
    gamesStore = [...store]; // Update in-memory cache after successful write
  }
  return success;
};

export const getAllGames = async (): Promise<Game[]> => {
  const store = await getStore();
  return JSON.parse(JSON.stringify(store));
};

export const getGameById = async (id: string): Promise<Game | null> => {
  const store = await getStore();
  const game = store.find((g) => g.id === id);
  return game ? JSON.parse(JSON.stringify(game)) : null;
};

export const addGame = async (gameData: CreateGameData): Promise<Game | null> => {
  let store = await getStore();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gameData.id)) {
    throw new Error("Game ID must be a valid slug (e.g., 'my-cool-game').");
  }

  const existingGame = store.find(g => g.id === gameData.id);
  if (existingGame) {
    throw new Error(`Game with ID '${gameData.id}' already exists.`);
  }

  const newGame: Game = {
    id: gameData.id,
    name: gameData.name,
    description: gameData.description,
    iconImageUrl: gameData.iconImageUrl || `https://placehold.co/100x100.png?text=${gameData.name.charAt(0)}`,
    imageUrl: gameData.imageUrl || `https://placehold.co/300x200.png`,
    bannerImageUrl: gameData.bannerImageUrl || `https://placehold.co/1200x400.png`,
    themeGradient: gameData.themeGradient || 'from-slate-500 to-slate-700',
    dataAiHint: gameData.dataAiHint || `${gameData.name.toLowerCase().replace(/\s+/g, '-')} game`,
    frequentlyUsedBanners: [],
    gameModes: gameData.id === 'free-fire' ? defaultFreeFireGameModes : (gameData.id === 'minecraft' ? defaultMinecraftGameModes : []),
    dailyTournamentTemplates: [],
  };

  store.push(newGame);
  const success = await saveStore(store);
  if (success) {
    return JSON.parse(JSON.stringify(newGame));
  } else {
    throw new Error("Failed to save new game data to file.");
  }
};

export const updateGame = async (gameId: string, updates: Partial<Omit<Game, 'id'>>): Promise<Game | undefined> => {
  let store = await getStore();
  const gameIndex = store.findIndex(g => g.id === gameId);
  if (gameIndex > -1) {
    const originalGame = { ...store[gameIndex] };

    const updatedGameModes = updates.gameModes !== undefined
      ? updates.gameModes.map(gm => ({
          ...gm,
          iconImageUrl: gm.iconImageUrl === '' ? undefined : (gm.iconImageUrl || `https://placehold.co/40x40.png?text=${gm.name.charAt(0)}`),
          bannerImageUrl: gm.bannerImageUrl === '' ? undefined : (gm.bannerImageUrl || `https://placehold.co/300x160.png`)
        }))
      : (originalGame.gameModes || []);

    const updatedDailyTemplates = updates.dailyTournamentTemplates !== undefined
      ? updates.dailyTournamentTemplates.map(dt => ({
          ...dt,
          imageUrl: dt.imageUrl === '' ? undefined : (dt.imageUrl || `https://placehold.co/400x250.png?text=Daily+Event`),
      }))
      : (originalGame.dailyTournamentTemplates || []);

    const updatedGameData: Game = {
      ...originalGame,
      ...updates,
      frequentlyUsedBanners: updates.frequentlyUsedBanners !== undefined ? [...updates.frequentlyUsedBanners] : (originalGame.frequentlyUsedBanners || []),
      gameModes: updatedGameModes,
      dailyTournamentTemplates: updatedDailyTemplates,
    };

    if (updates.hasOwnProperty('iconImageUrl')) {
        updatedGameData.iconImageUrl = updates.iconImageUrl || `https://placehold.co/100x100.png?text=${originalGame.name.charAt(0)}`;
    } else if (!updatedGameData.iconImageUrl) {
        updatedGameData.iconImageUrl = `https://placehold.co/100x100.png?text=${originalGame.name.charAt(0)}`;
    }

    if (updates.hasOwnProperty('imageUrl')) {
        updatedGameData.imageUrl = updates.imageUrl || `https://placehold.co/300x200.png`;
    } else if (!updatedGameData.imageUrl) {
         updatedGameData.imageUrl = `https://placehold.co/300x200.png`;
    }

    if (updates.hasOwnProperty('bannerImageUrl')) {
        updatedGameData.bannerImageUrl = updates.bannerImageUrl || `https://placehold.co/1200x400.png`;
    } else if (!updatedGameData.bannerImageUrl) {
        updatedGameData.bannerImageUrl = `https://placehold.co/1200x400.png`;
    }

    store[gameIndex] = updatedGameData;
    const success = await saveStore(store);
    if (success) {
      return JSON.parse(JSON.stringify(store[gameIndex]));
    } else {
      console.error(`Failed to write updates for game ${gameId} to file.`);
      throw new Error(`Failed to persist updates for game ${gameId}.`);
    }
  }
  console.warn(`Game with id ${gameId} not found for update.`);
  return undefined;
};

export const resetAllGames_ONLY_FOR_TESTING = async (): Promise<void> => {
  const seededData = initialGamesData.map(g => ({
    ...g,
    iconImageUrl: g.iconImageUrl || `https://placehold.co/100x100.png?text=${g.name.charAt(0)}`,
    frequentlyUsedBanners: [],
    gameModes: g.id === 'free-fire' ? defaultFreeFireGameModes : (g.id === 'minecraft' ? defaultMinecraftGameModes : []),
    dailyTournamentTemplates: [],
  }));
  const success = await saveStore(seededData);
  if (success) {
    console.log('All games have been reset to initial seed data (local file store).');
  } else {
    console.error('Failed to reset games file.');
  }
};

// Initialize the store when the module loads
if (process.env.NODE_ENV !== 'test') {
  getStore().catch(console.error);
}
