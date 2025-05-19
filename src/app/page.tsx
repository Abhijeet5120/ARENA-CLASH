
import { getAllGames } from '@/data/games'; 
import type { Game } from '@/data/games';
import { GameSelector } from '@/components/home/GameSelector';
import { Sparkles } from 'lucide-react';

export default async function GameSelectionPage() {
  const availableGames: Game[] = await getAllGames();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-card to-secondary p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="text-center mb-10 sm:mb-12 animate-fade-in-down">
        <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-3 sm:mb-4" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Welcome to <span className="text-primary">Arena Clash</span>
        </h1>
        <p className="mt-3 sm:mt-4 text-lg sm:text-xl text-muted-foreground max-w-md sm:max-w-2xl mx-auto">
          Select a game from the dropdown below to view upcoming tournaments and join the action.
        </p>
      </div>
      <GameSelector initialGames={availableGames} />
    </div>
  );
}
