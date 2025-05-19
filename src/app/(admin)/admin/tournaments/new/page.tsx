// src/app/(admin)/admin/tournaments/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TournamentForm, type TournamentFormValues } from '@/components/admin/TournamentForm';
import { getAllGames, type Game } from '@/data/games';
import { addTournament, type CreateTournamentData } from '@/data/tournaments';
import { useToast } from '@/hooks/use-toast';
import { useAdminContext } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';

export default function CreateTournamentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();
  const [gamesList, setGamesList] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      setIsLoadingGames(true);
      try {
        const fetchedGames = await getAllGames();
        setGamesList(fetchedGames);
      } catch (error) {
        console.error("Failed to fetch games for new tournament form:", error);
        toast({ title: "Error", description: "Could not load games list.", variant: "destructive" });
        setGamesList([]);
      } finally {
        setIsLoadingGames(false);
      }
    }
    fetchGames();
  }, [toast]);

  const handleFormSubmit = async (data: TournamentFormValues) => {
    try {
      const createData: CreateTournamentData = {
        name: data.name,
        gameId: data.gameId!,
        gameModeId: data.gameModeId,
        isSpecial: data.isSpecial,
        tournamentDate: data.tournamentDate.toISOString(),
        registrationCloseDate: data.registrationCloseDate.toISOString(),
        entryFee: Number(data.entryFee),
        entryFeeCurrency: data.entryFeeCurrency, 
        region: data.region, 
        prizePool: data.prizePool,
        totalSpots: Number(data.totalSpots),
        imageUrl: data.imageUrl,
        // dataAiHint is intentionally omitted as per previous design decisions to remove it from the form
      };
      await addTournament(createData);
      toast({ title: 'Success', description: `Tournament "${data.name}" created successfully for ${data.region} region.` });
      router.push('/admin/tournaments');
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      toast({ title: 'Error', description: error.message || 'Failed to create tournament.', variant: 'destructive' });
    }
  };

  if (isLoadingGames) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
        <p className="ml-4 text-muted-foreground">Loading game data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="outline" asChild className="transform hover:scale-105 transition-transform">
        <Link href="/admin/tournaments">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments List
        </Link>
      </Button>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <PlusCircle className="mr-3 h-7 w-7 text-primary" />
            Create New Tournament (for {adminSelectedRegion} Region)
          </CardTitle>
          <CardDescription>Fill in the details for the new tournament. All fields are required unless marked optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <TournamentForm
            onSubmit={handleFormSubmit}
            games={gamesList}
            onCancel={() => router.push('/admin/tournaments')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
