// src/app/(main)/[gameId]/tournaments/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getGameById, type Game } from '@/data/games';
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

// This page is now DEPRECATED as tournaments are listed by game mode.
// It can be removed or repurposed if a general "all non-special tournaments" view is desired.
// For now, redirecting or showing a message might be best.

export default function DeprecatedTournamentsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchGame = async () => {
        if (!gameId) {
          setError("Game ID is missing.");
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const foundGame = await getGameById(gameId);
          setGame(foundGame);
          if (!foundGame) {
            setError(`Game with ID "${gameId}" not found.`);
          }
        } catch (err: any) {
          setError(err.message || "Failed to load game data.");
        } finally {
          setIsLoading(false);
        }
    };
    fetchGame();
  }, [gameId]);


  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Spinner size="large" />
        <p className="ml-3 text-muted-foreground">Loading page...</p>
      </div>
    );
  }

  if (error || !game) {
     return (
      <div className="text-center py-10 sm:py-16 animate-in fade-in duration-500 delay-100 bg-card/70 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6">
        <AlertTriangle className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-destructive mb-4 sm:mb-6" />
        <h2 className="text-xl sm:text-2xl font-semibold text-destructive mb-2">Page Error</h2>
        <p className="text-muted-foreground text-md sm:text-lg max-w-sm sm:max-w-md mx-auto mb-4 sm:mb-6">{error || "Game data could not be loaded."}</p>
        <Button asChild variant="default" className="mt-6 sm:mt-8 transform hover:scale-105 transition-transform">
          <Link href={`/${gameId || ''}`}>Back to Game Page</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="animate-in fade-in duration-500">
        <Button asChild variant="outline" className="mb-4 sm:mb-6 transform hover:scale-105 transition-transform">
          <Link href={`/${game.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {game.name}
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 bg-card/50 backdrop-blur-sm rounded-lg shadow-md">
          {game.iconImageUrl ? (
            <Image
              src={game.iconImageUrl}
              alt={`${game.name} icon`}
              width={40}
              height={40}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-md object-cover border border-border"
            />
          ) : (
            <Puzzle className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          )}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {game.name} Tournaments
            </h1>
            <p className="text-md sm:text-lg text-muted-foreground">
              This page is no longer the primary way to view tournaments. Please select a game mode from the main {game.name} page.
            </p>
          </div>
        </div>
      </header>

       <div className="text-center py-10 sm:py-16 animate-in fade-in duration-500 delay-100 bg-card/70 backdrop-blur-sm rounded-xl shadow-lg">
          <Trophy className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground/50 mb-4 sm:mb-6" />
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Tournament Viewing Changed</h2>
          <p className="text-muted-foreground text-md sm:text-lg max-w-sm sm:max-w-md mx-auto">
            Tournaments are now organized by game mode. Please navigate back to the main page for <strong>{game.name}</strong> to select a specific game mode and view its tournaments.
          </p>
          <Button asChild variant="default" className="mt-6 sm:mt-8 transform hover:scale-105 transition-transform">
            <Link href={`/${game.id}`}>Go to {game.name} Page</Link>
          </Button>
        </div>
    </div>
  );
}
