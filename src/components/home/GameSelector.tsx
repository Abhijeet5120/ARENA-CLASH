// src/components/home/GameSelector.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Game } from '@/data/games';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react'; 
import Image from 'next/image';
import { getAllGames } from '@/data/games'; 
import { Spinner } from '@/components/ui/spinner';

interface GameSelectorProps {
  initialGames?: Game[]; 
}

export function GameSelector({ initialGames }: GameSelectorProps) {
  const router = useRouter();
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>(undefined);
  const [gamesToDisplay, setGamesToDisplay] = useState<Game[]>(initialGames || []);
  const [isLoadingClient, setIsLoadingClient] = useState(!initialGames || initialGames.length === 0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!initialGames || initialGames.length === 0) {
      setIsLoadingClient(true);
      getAllGames()
        .then(fetchedGames => {
          setGamesToDisplay(fetchedGames);
        })
        .catch(error => {
          console.error("Failed to fetch games on client:", error);
          setGamesToDisplay([]); 
        })
        .finally(() => {
          setIsLoadingClient(false);
        });
    } else {
      setGamesToDisplay(initialGames);
      setIsLoadingClient(false);
    }
  }, [initialGames]);

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
  };

  const navigateToGame = () => {
    if (selectedGameId) {
      router.push(`/${selectedGameId}`);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1) {
      return (words[0][0] + (words[1][0] || '')).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };
  
  if (!isClient) {
    return (
      <div className="w-full max-w-xs sm:max-w-sm animate-fade-in-up flex flex-col items-center" style={{ animationDelay: `150ms` }}>
        <div className="h-10 px-4 text-sm rounded-xl shadow-lg bg-background/80 backdrop-blur-sm w-full flex items-center justify-center text-muted-foreground">
          Loading games...
        </div>
        <div className="mt-6 w-full">
          <Button
            variant="default"
            className="h-10 px-4 text-sm rounded-xl w-full"
            disabled
          >
            View Tournaments
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingClient) {
    return (
      <div className="w-full max-w-xs sm:max-w-sm animate-fade-in-up flex flex-col items-center" style={{ animationDelay: `150ms` }}>
        <div className="h-10 px-4 text-sm rounded-xl shadow-lg bg-background/80 backdrop-blur-sm w-full flex items-center justify-center">
          <Spinner size="small" className="mr-2" /> Loading games...
        </div>
         <div className="mt-6 w-full">
          <Button
            variant="default"
            className="h-10 px-4 text-sm rounded-xl w-full"
            disabled
          >
            View Tournaments
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (gamesToDisplay.length === 0) {
    return (
       <div className="w-full max-w-xs sm:max-w-sm animate-fade-in-up flex flex-col items-center" style={{ animationDelay: `150ms` }}>
        <div className="flex items-center justify-center h-10 w-full rounded-xl bg-muted/50 backdrop-blur-sm shadow-lg text-center p-2">
          <p className="text-sm text-muted-foreground">No games available.</p>
        </div>
         <div className="mt-6 w-full">
          <Button
            variant="default"
            className="h-10 px-4 text-sm rounded-xl w-full"
            disabled
          >
            View Tournaments
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs sm:max-w-sm animate-fade-in-up flex flex-col items-center" style={{ animationDelay: `150ms` }}>
      <Select onValueChange={handleGameSelect} value={selectedGameId}>
        <SelectTrigger className="h-10 px-4 text-sm rounded-xl shadow-lg focus:ring-2 focus:ring-primary bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out hover:shadow-primary/30 focus:shadow-primary/30 w-full">
          <SelectValue placeholder="Choose your game..." />
        </SelectTrigger>
        <SelectContent
          className="bg-popover/90 backdrop-blur-xl border border-border/50 text-popover-foreground rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-3 duration-300 ease-out"
          style={{ animationDuration: '200ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          {gamesToDisplay.map((game) => (
            <SelectItem
              key={game.id}
              value={game.id}
              className="text-sm py-2.5 hover:bg-accent/60 focus:bg-accent/70 cursor-pointer rounded-lg transition-all duration-150 ease-out hover:scale-[1.02] focus:scale-[1.02] backdrop-blur-sm"
            >
              <span className="flex items-center w-full">
                {game.iconImageUrl ? (
                  <Image
                    src={game.iconImageUrl}
                    alt={`${game.name} icon`}
                    width={20}
                    height={20}
                    className="mr-3 h-5 w-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="mr-3 h-5 w-5 rounded bg-muted flex items-center justify-center text-primary font-medium text-xs flex-shrink-0 border border-border">
                    {getInitials(game.name)}
                  </div>
                )}
                <span className="truncate flex-grow">{game.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="mt-6 flex justify-center w-full">
        <Button
          onClick={navigateToGame}
          disabled={!selectedGameId || gamesToDisplay.length === 0}
          variant="default"
          className="h-10 px-4 text-sm rounded-xl transition-all duration-300 ease-in-out disabled:opacity-50 transform hover:scale-105 w-full"
        >
          View Tournaments
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
