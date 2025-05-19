// src/app/(main)/[gameId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getGameById, type Game } from '@/data/games';
import { getTournamentsByGameId, getSpecialTournamentsByGameId, type Tournament } from '@/data/tournaments';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Layers, Sparkles, Puzzle, ImageOff, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRegion } from '@/data/users';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { GameSpecificHeader } from '@/components/game/GameSpecificHeader';
import { cn } from '@/lib/utils';


export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [specialTournaments, setSpecialTournaments] = useState<Tournament[]>([]);
  const [tournamentCountsByMode, setTournamentCountsByMode] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayRegion, setDisplayRegion] = useState<UserRegion | "All Regions">('USA');

  const loadData = useCallback(async () => {
    if (!gameId) {
      setError("Game ID is missing from URL parameters.");
      setIsLoading(false);
      setGame(null);
      setSpecialTournaments([]);
      setTournamentCountsByMode({});
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
        const fetchedSpecialTournaments = await getSpecialTournamentsByGameId(foundGame.id, currentEffectiveRegion);
        setSpecialTournaments(fetchedSpecialTournaments);

        const allNonSpecialTournaments = await getTournamentsByGameId(foundGame.id, currentEffectiveRegion);
        const counts: Record<string, number> = {};
        allNonSpecialTournaments.forEach(tournament => {
          if (tournament.gameModeId) {
            counts[tournament.gameModeId] = (counts[tournament.gameModeId] || 0) + 1;
          }
        });
        setTournamentCountsByMode(counts);

      } else {
        setError(`Game with ID "${gameId}" not found.`);
        setGame(null);
        setSpecialTournaments([]);
        setTournamentCountsByMode({});
      }
    } catch (err: any) {
      console.error(`Error loading data for game ${gameId}:`, err);
      setError(err.message || "Failed to load game data. Please try again.");
      setGame(null);
      setSpecialTournaments([]);
      setTournamentCountsByMode({});
    } finally {
      setIsLoading(false);
    }
  }, [gameId, user, authLoading, isLoggedIn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || (authLoading && !game && !error)) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Spinner size="large" />
        <p className="ml-3 text-muted-foreground">Loading game details for {displayRegion}...</p>
      </div>
    );
  }

  if (error && !game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Game</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Link href="/">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Go to Game Selection
          </button>
        </Link>
      </div>
    );
  }

  if (!game) {
    notFound();
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="text-center py-4 sm:py-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 md:gap-6 text-center md:text-left">
          <div className="flex-shrink-0">
            {game.iconImageUrl ? (
              <Image
                src={game.iconImageUrl}
                alt={`${game.name} icon`}
                width={112}
                height={112}
                className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 object-contain"
                data-ai-hint={game.id}
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-lg flex items-center justify-center text-primary font-bold text-5xl sm:text-6xl">
                {game.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {game.name}
            </h1>
            {game.description && (
              <p className="mt-1 text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-2xl mx-auto md:mx-0">
                {game.description}
              </p>
            )}
             <p className="text-sm sm:text-base text-muted-foreground/80 mt-2">
                Displaying tournaments for: <span className="font-semibold">{displayRegion}</span>
            </p>
          </div>
        </div>
      </header>

      <GameSpecificHeader game={game} />

      <section className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200 pt-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center">
            <Layers className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:h-6 text-primary" />
            Game Modes
          </h2>
        </div>
        {(game.gameModes && game.gameModes.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {game.gameModes.map((mode, index) => (
              <Link
                key={mode.id}
                href={`/${gameId}/gamemodes/${mode.id}`}
                className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                style={{ animationDelay: `${index * 75 + 200}ms`, animationFillMode: 'backwards' }}
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col h-full bg-card/80 backdrop-blur-sm group-hover:bg-card/70 group-hover:backdrop-blur-md rounded-xl border border-border/70 hover:border-primary/50 focus-within:border-primary/50">
                  <CardHeader className="p-0 relative h-24 sm:h-28 md:h-32 flex-shrink-0"> {/* Reduced banner height */}
                    {mode.bannerImageUrl ? (
                      <Image
                        src={mode.bannerImageUrl}
                        alt={`${mode.name} banner`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={mode.bannerDataAiHint}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/50">
                        <Puzzle className="h-8 w-8 sm:h-10 sm:h-10" /> {/* Slightly smaller placeholder */}
                      </div>
                    )}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity"
                    ></div>
                    {(tournamentCountsByMode[mode.id] || 0) > 0 && (
                      <Badge variant="secondary" className="absolute top-1.5 right-1.5 text-xs px-1.5 py-0.5 shadow-md backdrop-blur-sm bg-background/70">
                        {tournamentCountsByMode[mode.id]} {tournamentCountsByMode[mode.id] === 1 ? 'Event' : 'Events'}
                      </Badge>
                    )}
                    {(tournamentCountsByMode[mode.id] === undefined || tournamentCountsByMode[mode.id] === 0) && (
                      <Badge variant="outline" className="absolute top-1.5 right-1.5 text-xs px-1.5 py-0.5 shadow-md backdrop-blur-sm bg-background/70">
                        No Events
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 flex-grow flex flex-col justify-between">
                    <div className="flex items-center mb-1.5 gap-2">
                       {mode.iconImageUrl ? (
                        <Image
                          src={mode.iconImageUrl}
                          alt={`${mode.name} icon`}
                          width={28} 
                          height={28}
                          className="h-6 w-6 sm:h-7 sm:w-7 rounded-md object-contain flex-shrink-0"
                          data-ai-hint={mode.dataAiHint || mode.id}
                        />
                      ) : (
                        <Puzzle className="h-6 w-6 sm:h-7 sm:w-7 text-primary/70 flex-shrink-0" />
                      )}
                      <CardTitle className="text-base sm:text-md font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {mode.name}
                      </CardTitle>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground/80 group-hover:text-primary/80 transition-colors line-clamp-2 mb-2 h-8 sm:h-10">
                      {mode.description || `Explore ${mode.name} tournaments.`}
                    </p>
                    <div className="mt-auto flex justify-end">
                       <ChevronRight className="h-4 w-4 sm:h-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-card/80 backdrop-blur-sm shadow-lg text-center py-5 sm:py-6">
            <CardContent className="p-3 sm:p-4">
              <ImageOff className="mx-auto h-8 w-8 text-muted-foreground/50 mb-1.5"/>
              <p className="text-muted-foreground text-xs sm:text-sm">
                No game modes defined for {game.name} yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300 pt-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center">
            <Sparkles className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:h-6 text-amber-400" />
            Special Tournaments ({displayRegion})
          </h2>
        </div>
        {specialTournaments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {specialTournaments.map((tournament, index) => (
              <div
                key={tournament.id}
                className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 ease-out"
                style={{ animationDelay: `${index * 75 + 300}ms`, animationFillMode: 'backwards' }}
              >
                <TournamentCard tournament={tournament} currentUserRegion={user?.region || 'USA'} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="bg-card/80 backdrop-blur-sm shadow-lg text-center py-5 sm:py-6">
            <CardContent className="p-3 sm:p-4">
              <ImageOff className="mx-auto h-8 w-8 text-muted-foreground/50 mb-1.5"/>
              <p className="text-muted-foreground text-xs sm:text-sm">
                No special tournaments for {game.name} in {displayRegion === "All Regions" ? "any region" : displayRegion} at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
