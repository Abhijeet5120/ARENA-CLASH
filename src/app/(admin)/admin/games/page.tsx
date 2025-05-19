// src/app/(admin)/admin/games/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAllGames, type Game } from '@/data/games';
import { getAllTournaments, type Tournament } from '@/data/tournaments'; 
import { useAdminContext } from '@/context/AdminContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, Settings, BarChartBig, Users, Gamepad2 as Gamepad2LucideIcon, ImageOff } from 'lucide-react';


interface GameWithStats extends Game {
  tournamentCount: number;
  totalSpotsFilled: number;
  totalSpotsAvailable: number;
}

export default function AdminGamesPage() {
  const [gamesWithStats, setGamesWithStats] = useState<GameWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();

  const loadGameData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all games (games are platform-wide)
      // Fetch tournaments filtered by adminSelectedRegion to calculate regional stats for games
      const [fetchedGames, regionalTournaments] = await Promise.all([
        getAllGames(),
        getAllTournaments(adminSelectedRegion) 
      ]);

      const stats: GameWithStats[] = fetchedGames.map(game => {
        const gameTournamentsInRegion = regionalTournaments.filter(t => t.gameId === game.id);
        const tournamentCount = gameTournamentsInRegion.length;
        const totalSpotsFilled = gameTournamentsInRegion.reduce((sum, t) => sum + (t.totalSpots - t.spotsLeft), 0);
        const totalSpotsAvailable = gameTournamentsInRegion.reduce((sum, t) => sum + t.totalSpots, 0);
        return { ...game, tournamentCount, totalSpotsFilled, totalSpotsAvailable };
      });
      setGamesWithStats(stats);
    } catch (error) {
      console.error("Failed to load game data:", error);
      toast({ title: "Error", description: "Could not load game data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, adminSelectedRegion]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  const filteredGames = gamesWithStats.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
        <p className="ml-4 text-muted-foreground">Loading game data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Games</h1>
          <p className="text-muted-foreground">View game statistics (for {adminSelectedRegion} region) and manage game-specific content.</p>
        </div>
        <Button asChild className="transform hover:scale-105 transition-transform rounded-lg">
          <Link href="/admin/games/new">
            <span className="flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Game
            </span>
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        <Input
          type="search"
          placeholder="Search games by name..."
          className="w-full pl-10 shadow-sm bg-background/70 backdrop-blur-sm rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game, index) => (
            <Card
              key={game.id}
              className="shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-card/70 hover:backdrop-blur-md rounded-xl animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="relative p-0">
                <Image
                  src={game.bannerImageUrl || `https://placehold.co/400x180.png`}
                  alt={`${game.name} banner`}
                  width={400}
                  height={180}
                  className="w-full h-36 object-cover rounded-t-xl group-hover:opacity-90 transition-opacity"
                  data-ai-hint={game.dataAiHint}
                  key={game.bannerImageUrl || game.id}
                />
                <div className={`absolute inset-0 ${game.themeGradient || 'from-transparent to-transparent'} opacity-40 rounded-t-xl`}></div>
                 <div className="absolute bottom-0 left-0 p-4 flex items-center">
                  {game.iconImageUrl ? (
                      <Image 
                        src={game.iconImageUrl} 
                        alt={`${game.name} icon`} 
                        width={32} 
                        height={32} 
                        className="mr-2 h-8 w-8 rounded-md object-cover"
                      />
                    ) : (
                      <ImageOff className="mr-2 h-8 w-8 text-primary-foreground/70" />
                    )}
                  <CardTitle className="text-2xl font-bold text-primary-foreground drop-shadow-lg">
                    {game.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground h-16 overflow-hidden text-ellipsis">
                  {game.description}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <BarChartBig className="mr-2 h-4 w-4 text-primary" />
                  <span>{game.tournamentCount} Tournaments Hosted (in {adminSelectedRegion})</span>
                </div>
                 <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  <span>{game.totalSpotsFilled} / {game.totalSpotsAvailable || 0} Spots Filled (in {adminSelectedRegion})</span>
                </div>
              </CardContent>
              <CardFooter className="p-5 border-t border-border/50">
                <Button asChild className="w-full transform hover:scale-105 transition-transform rounded-lg">
                  <Link href={`/admin/games/${game.id}`}>
                    <span className="flex items-center justify-center">
                      <Settings className="mr-2 h-4 w-4" /> Manage Game
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl min-h-[200px] flex flex-col justify-center items-center">
          <Gamepad2LucideIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
          {searchTerm ? (
             <p className="text-lg">No games found matching "{searchTerm}".</p>
          ) : (
            <p className="text-lg">No games available to manage. Create one to get started!</p>
          )}
        </div>
      )}
    </div>
  );
}
