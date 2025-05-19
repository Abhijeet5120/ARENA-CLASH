// src/data/games.ts
'use server';

import { readDataFromFile, writeDataToFile } from '@/lib/localFileStore';

export interface GameMode {
  id: string; // e.g., 'cs-1v1', 'fm-solo'
  name: string; // e.g., "Clash Squad 1v1", "Full Map Solo"
  description?: string;
  iconImageUrl?: string; 
  dataAiHint?: string; 
  bannerImageUrl?: string; 
  bannerDataAiHint?: string; 
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
}

export type CreateGameData = Pick<Game, 'id' | 'name' | 'description'> & {
  iconImageUrl?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  themeGradient?: string;
  dataAiHint?: string;
};

const GAMES_FILE = 'games.json';
const initialGamesData: Omit<Game, 'frequentlyUsedBanners' | 'iconImageUrl' | 'gameModes'>[] = [
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
  { id: 'cs-1v1', name: 'Clash Squad 1v1', description: 'Intense 1v1 battles in a small zone.', iconImageUrl: 'https://placehold.co/40x40.png?text=1v1', dataAiHint: '1v1 combat', bannerImageUrl: 'https://placehold.co/300x160.png?text=CS+1v1', bannerDataAiHint: 'clash squad' },
  { id: 'cs-2v2', name: 'Clash Squad 2v2', description: 'Team up for 2v2 tactical combat.', iconImageUrl: 'https://placehold.co/40x40.png?text=2v2', dataAiHint: '2v2 team fight', bannerImageUrl: 'https://placehold.co/300x160.png?text=CS+2v2', bannerDataAiHint: 'team combat'},
  { id: 'cs-4v4', name: 'Clash Squad 4v4', description: 'Classic 4v4 squad-based rounds.', iconImageUrl: 'https://placehold.co/40x40.png?text=4v4', dataAiHint: 'squad battle', bannerImageUrl: 'https://placehold.co/300x160.png?text=CS+4v4', bannerDataAiHint: 'squads fighting'},
  { id: 'fm-solo', name: 'Full Map Solo', description: 'Survive alone on the vast island.', iconImageUrl: 'https://placehold.co/40x40.png?text=Solo', dataAiHint: 'solo survival', bannerImageUrl: 'https://placehold.co/300x160.png?text=Solo+Map', bannerDataAiHint: 'survival map'},
  { id: 'fm-duo', name: 'Full Map Duo', description: 'Partner up and fight for victory.', iconImageUrl: 'https://placehold.co/40x40.png?text=Duo', dataAiHint: 'duo teamwork', bannerImageUrl: 'https://placehold.co/300x160.png?text=Duo+Map', bannerDataAiHint: 'team survival'},
  { id: 'fm-squad', name: 'Full Map Squad', description: 'Coordinate with your squad to win.', iconImageUrl: 'https://placehold.co/40x40.png?text=Sqd', dataAiHint: 'squad strategy', bannerImageUrl: 'https://placehold.co/300x160.png?text=Squad+Map', bannerDataAiHint: 'squad map'},
  { id: 'lw-1v1', name: 'Lone Wolf 1v1', description: 'Fast-paced 1v1 duels with preset loadouts.', iconImageUrl: 'https://placehold.co/40x40.png?text=LW1', dataAiHint: 'duel mode', bannerImageUrl: 'https://placehold.co/300x160.png?text=LW+1v1', bannerDataAiHint: 'lone wolf'},
  { id: 'lw-2v2', name: 'Lone Wolf 2v2', description: '2v2 action with preset weapon choices.', iconImageUrl: 'https://placehold.co/40x40.png?text=LW2', dataAiHint: 'duo challenge', bannerImageUrl: 'https://placehold.co/300x160.png?text=LW+2v2', bannerDataAiHint: 'duo combat'},
];

const defaultMinecraftGameModes: GameMode[] = [
    { id: 'survival', name: 'Survival', description: 'Gather resources, build, and survive.', iconImageUrl: 'https://placehold.co/40x40.png?text=Surv', dataAiHint: 'survival gameplay', bannerImageUrl: 'https://placehold.co/300x160.png?text=MC+Survival', bannerDataAiHint: 'minecraft world' },
    { id: 'creative', name: 'Creative', description: 'Unlimited resources to build anything.', iconImageUrl: 'https://placehold.co/40x40.png?text=Crea', dataAiHint: 'building mode', bannerImageUrl: 'https://placehold.co/300x160.png?text=MC+Creative', bannerDataAiHint: 'minecraft structures' },
    { id: 'bed-wars', name: 'Bed Wars', description: 'Protect your bed and destroy others.', iconImageUrl: 'https://placehold.co/40x40.png?text=BedW', dataAiHint: 'pvp strategy', bannerImageUrl: 'https://placehold.co/300x160.png?text=MC+BedWars', bannerDataAiHint: 'minecraft battle' },
];


const getStore = async (): Promise<Game[]> => {
  let fileData = await readDataFromFile<Game[]>(GAMES_FILE, []);
  if (fileData.length === 0 && initialGamesData.length > 0) {
    console.log("Games.json is empty or not found, seeding with initial game data...");
    const seededGames = initialGamesData.map(g => ({
      ...g,
      iconImageUrl: g.iconImageUrl || `https://placehold.co/100x100.png?text=${g.name.charAt(0)}`,
      frequentlyUsedBanners: [],
      gameModes: g.id === 'free-fire' ? defaultFreeFireGameModes : (g.id === 'minecraft' ? defaultMinecraftGameModes : []),
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
      }))];
    }
  }
  // Ensure all games (even existing ones) have gameModes, iconImageUrl, etc., with defaults if missing
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
        }))
    };
  });
};

const saveStore = async (store: Game[]): Promise<boolean> => {
  return await writeDataToFile(GAMES_FILE, store);
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

    // Handle game modes update: if updates.gameModes is provided, use it entirely.
    // Otherwise, keep the original game modes.
    const updatedGameModes = updates.gameModes !== undefined 
      ? updates.gameModes.map(gm => ({
          ...gm,
          // Apply placeholders only if the URL is genuinely undefined, not if it's an empty string (which means cleared)
          iconImageUrl: gm.iconImageUrl === '' ? undefined : (gm.iconImageUrl || `https://placehold.co/40x40.png?text=${gm.name.charAt(0)}`),
          bannerImageUrl: gm.bannerImageUrl === '' ? undefined : (gm.bannerImageUrl || `https://placehold.co/300x160.png`)
        }))
      : originalGame.gameModes;

    const updatedGameData: Game = {
      ...originalGame,
      ...updates,
      frequentlyUsedBanners: updates.frequentlyUsedBanners !== undefined ? [...updates.frequentlyUsedBanners] : (originalGame.frequentlyUsedBanners || []),
      gameModes: updatedGameModes,
    };
    
    // Ensure fallback for game-level image URLs if they are explicitly set to empty or undefined in updates
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
  }));
  const success = await saveStore(seededData);
  if (success) {
    console.log('All games have been reset to initial seed data (local file store).');
  } else {
    console.error('Failed to reset games file.');
  }
};

    