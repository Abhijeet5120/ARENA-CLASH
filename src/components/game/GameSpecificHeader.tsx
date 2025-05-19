// src/components/game/GameSpecificHeader.tsx
import type { Game } from '@/data/games';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface GameSpecificHeaderProps {
  game: Game;
}

export function GameSpecificHeader({ game }: GameSpecificHeaderProps) {
  const bannerSrc = game.bannerImageUrl || `https://placehold.co/1200x400.png`;
  const gameNameForHint = game.name || 'Unnamed Game';
  const gameDataAiHint = game.dataAiHint || `${gameNameForHint.toLowerCase().replace(/\s+/g, '-')} banner`;
  // Use a fallback dark overlay if no theme gradient is provided or if it's an empty string
  const effectiveThemeGradient = game.themeGradient && game.themeGradient.trim() !== '' ? game.themeGradient : 'from-slate-900/70 to-slate-800/90';

  return (
    <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-xl sm:shadow-2xl animate-in fade-in duration-500">
      <Image
        src={bannerSrc}
        alt={`${gameNameForHint} banner`}
        width={1200}
        height={400}
        className="w-full h-40 sm:h-56 md:h-64 object-cover"
        priority
        data-ai-hint={gameDataAiHint}
      />
      <div
        className={cn(
          `absolute inset-0 mix-blend-multiply opacity-80 md:opacity-90`, // Removed backdrop-blur classes
          effectiveThemeGradient
        )}
      ></div>
    </div>
  );
}
