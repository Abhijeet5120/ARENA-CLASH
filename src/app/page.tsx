
import { getAllGames } from '@/data/games';
import type { Game } from '@/data/games';
import { GameSelector } from '@/components/home/GameSelector';
import { Sparkles } from 'lucide-react';

export default async function GameSelectionPage() {
  const availableGames: Game[] = await getAllGames();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-card to-secondary p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="text-center mb-8 sm:mb-10 animate-fade-in-down">
        <Sparkles className="h-10 w-10 sm:h-12 sm:h-12 text-primary mx-auto mb-2 sm:mb-3" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Welcome to <span className="text-primary">Arena Clash</span>
        </h1>
        <p className="mt-2 sm:mt-3 text-md sm:text-lg text-muted-foreground max-w-md sm:max-w-xl mx-auto">
          Choose your game from the dropdown below. Find tournaments, join the action, and climb the ranks!
        </p>
      </div>
      <GameSelector initialGames={availableGames} />
    </div>
  );
}
