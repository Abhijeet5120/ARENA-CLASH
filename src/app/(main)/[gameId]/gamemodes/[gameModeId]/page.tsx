// src/app/(main)/[gameId]/gamemodes/[gameModeId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getGameById, type Game, type GameMode } from '@/data/games';
import { getTournamentsByGameId, type Tournament } from '@/data/tournaments';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Trophy, AlertTriangle, Puzzle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import type { UserRegion } from '@/data/users';
import { cn } from '@/lib/utils';

export default function GameModeTournamentsPage() {
  const { gameId, gameModeId } = useParams<{ gameId: string; gameModeId: string }>();
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [gameMode, setGameMode] = useState<GameMode | null | undefined>(undefined);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayRegion, setDisplayRegion] = useState<UserRegion | "All Regions">('USA');

  const loadData = useCallback(async () => {
    if (!gameId || !gameModeId) {
      setError("Game ID or Game Mode ID is missing from URL parameters.");
      setIsLoading(false);
      setGame(null);
      setGameMode(null);
      setTournaments([]);
      return;
    }

    if (authLoading) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    let currentEffectiveRegion: UserRegion | undefined = undefined;

    if (user && isLoggedIn) {
      currentEffectiveRegion = user.region;
      setDisplayRegion(user.region);
    } else {
      currentEffectiveRegion = undefined;
      setDisplayRegion("All Regions");
    }

    try {
      const foundGame = await getGameById(gameId);
      setGame(foundGame);

      if (foundGame) {
        const foundGameMode = foundGame.gameModes.find(gm => gm.id === gameModeId);
        setGameMode(foundGameMode);

        if (foundGameMode) {
          const fetchedTournaments = await getTournamentsByGameId(foundGame.id, currentEffectiveRegion, gameModeId);
          setTournaments(fetchedTournaments);
        } else {
          setError(`Game Mode with ID "${gameModeId}" not found for game "${foundGame.name}".`);
          setGameMode(null);
          setTournaments([]);
        }
      } else {
        setError(`Game with ID "${gameId}" not found.`);
        setGame(null);
        setGameMode(null);
        setTournaments([]);
      }
    } catch (err: any) {
      console.error(`Failed to fetch data for game ${gameId}, mode ${gameModeId}:`, err);
      setError(err.message || "Failed to load data.");
      setGame(null);
      setGameMode(null);
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, gameModeId, user, authLoading, isLoggedIn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || (authLoading && !game && !gameMode && !error)) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Spinner size="large" />
        <p className="ml-3 text-muted-foreground">Loading tournaments for {displayRegion}...</p>
      </div>
    );
  }

  if (error && (!game || !gameMode)) {
    return (
      <div className="text-center py-6 sm:py-8 animate-in fade-in duration-500 delay-100 bg-card/70 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4">
        <AlertTriangle className="mx-auto h-10 w-10 sm:h-16 sm:w-16 text-destructive mb-2 sm:mb-3" />
        <h2 className="text-md sm:text-lg font-semibold text-destructive mb-1 sm:mb-1.5">Error Loading Data</h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-xs sm:max-w-sm mx-auto mb-2.5 sm:mb-3">{error}</p>
        <Button asChild variant="default" className="mt-3 sm:mt-4 transform hover:scale-105 transition-transform">
          <Link href={`/${gameId || ''}`}>Back to {game?.name || 'Game'} Page</Link>
        </Button>
      </div>
    );
  }

  if (!game || !gameMode) {
    notFound();
    return null;
  }

  const gameModeBannerSrc = gameMode.bannerImageUrl || `https://placehold.co/1200x300.png`;
  const gameModeBannerHint = gameMode.bannerDataAiHint || `${gameMode.name.toLowerCase()} banner`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="py-4 sm:py-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 md:gap-6 text-center md:text-left">
          <div className="flex-shrink-0">
            {gameMode.iconImageUrl ? (
              <Image
                src={gameMode.iconImageUrl}
                alt={`${gameMode.name} icon`}
                width={96}
                height={96}
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-lg object-contain"
                data-ai-hint={gameMode.dataAiHint || gameMode.id}
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-lg bg-muted flex items-center justify-center text-primary font-bold text-3xl sm:text-4xl shadow-sm">
                <Puzzle className="h-8 w-8 sm:h-10 sm:w-10"/>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {game.name}: {gameMode.name}
            </h1>
            {gameMode.description && (
              <p className="mt-1 text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-lg mx-auto md:mx-0">
                {gameMode.description}
              </p>
            )}
            <p className="text-sm sm:text-base text-muted-foreground/80 mt-2">
                Displaying tournaments for: <span className="font-semibold">{displayRegion}</span>
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="mt-4 sm:mt-6 transform hover:scale-105 transition-transform bg-background/70 hover:bg-background/90 text-foreground backdrop-blur-sm text-sm px-4 h-9 sm:text-base sm:px-5 sm:h-10">
          <Link href={`/${game.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:h-5" />
              Back to {game.name}
          </Link>
        </Button>
      </header>

       <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-xl sm:shadow-2xl animate-in fade-in duration-500 delay-100">
         <Image
          src={gameModeBannerSrc}
          alt={`${gameMode.name} banner for ${game.name}`}
          width={1200}
          height={300}
          className="w-full h-40 sm:h-48 md:h-56 object-cover"
          priority
          data-ai-hint={gameModeBannerHint}
        />
       </div>

      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300 delay-150">
          {tournaments.map((tournament, index) => (
            <div
              key={tournament.id}
              className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out"
              style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
            >
              <TournamentCard tournament={tournament} currentUserRegion={user?.region || 'USA'} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 animate-in fade-in duration-500 delay-100 bg-card/70 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4">
          <Trophy className="mx-auto h-10 w-10 sm:h-16 sm:w-16 text-muted-foreground/50 mb-2 sm:mb-3" />
          <h2 className="text-md sm:text-lg font-semibold text-foreground mb-1 sm:mb-1.5">No Tournaments Yet</h2>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-xs sm:max-w-sm mx-auto">
            It seems there are no {gameMode.name} tournaments scheduled for {game.name} in {displayRegion === "All Regions" ? "any region" : displayRegion} right now.
            Please check back later!
          </p>
          <Button asChild variant="default" className="mt-3 sm:mt-4 transform hover:scale-105 transition-transform">
            <Link href={`/${game.id}`}>Explore Other Game Modes</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
