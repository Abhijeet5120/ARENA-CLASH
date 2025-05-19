// src/app/(admin)/admin/tournaments/[tournamentId]/edit/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TournamentForm, type TournamentFormValues } from '@/components/admin/TournamentForm';
import { getAllGames, type Game } from '@/data/games';
import { updateTournament, getTournamentById, type Tournament, type UpdateTournamentData } from '@/data/tournaments';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditTournamentPage() {
  const router = useRouter();
  const { tournamentId: tournamentIdFromParams } = useParams<{ tournamentId: string }>();
  const { toast } = useToast();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoadingTournament, setIsLoadingTournament] = useState(true);
  const [gamesList, setGamesList] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  const loadTournament = useCallback(async () => {
    if (!tournamentIdFromParams) {
      toast({ title: 'Error', description: 'Tournament ID is missing.', variant: 'destructive' });
      router.push('/admin/tournaments');
      return;
    }
    setIsLoadingTournament(true);
    try {
      const fetchedTournament = await getTournamentById(tournamentIdFromParams);
      if (fetchedTournament) {
        setTournament(fetchedTournament);
      } else {
        toast({ title: 'Error', description: 'Tournament not found.', variant: 'destructive' });
        setTournament(null);
      }
    } catch (error) {
      console.error("Failed to load tournament data:", error);
      toast({ title: 'Error', description: 'Failed to load tournament details.', variant: 'destructive' });
      setTournament(null);
    } finally {
      setIsLoadingTournament(false);
    }
  }, [tournamentIdFromParams, toast, router]);

  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  useEffect(() => {
    async function fetchGames() {
      setIsLoadingGames(true);
      try {
        const fetchedGames = await getAllGames();
        setGamesList(fetchedGames);
      } catch (error) {
        console.error("Failed to fetch games for edit tournament form:", error);
        toast({ title: "Error", description: "Could not load games list.", variant: "destructive" });
        setGamesList([]);
      } finally {
        setIsLoadingGames(false);
      }
    }
    fetchGames();
  }, [toast]);

  const handleFormSubmit = async (data: TournamentFormValues) => {
    if (!tournament) return;
    try {
      const updateData: UpdateTournamentData = {
        name: data.name,
        tournamentDate: data.tournamentDate.toISOString(),
        registrationCloseDate: data.registrationCloseDate.toISOString(),
        entryFee: Number(data.entryFee),
        prizePool: data.prizePool,
        imageUrl: data.imageUrl,
        totalSpots: Number(data.totalSpots),
        gameModeId: data.gameModeId, // Added
        isSpecial: data.isSpecial,     // Added
        // entryFeeCurrency and region are part of the tournament and should not be changed here typically
        // or handled with more complex logic if they can be.
      };
      const updated = await updateTournament(tournament.id, updateData);
      if (updated) {
        toast({ title: 'Success', description: 'Tournament updated successfully.' });
        router.push('/admin/tournaments');
      } else {
         throw new Error('Failed to update tournament or tournament not found.');
      }
    } catch (error: any) {
      console.error("Error updating tournament:", error);
      toast({ title: 'Error', description: error.message || 'Failed to update tournament.', variant: 'destructive' });
    }
  };

  if (isLoadingTournament || isLoadingGames) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
        <p className="ml-4 text-muted-foreground">Loading tournament details...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
        <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">Tournament not found or could not be loaded.</p>
            <Button asChild variant="link" className="mt-4">
                <Link href="/admin/tournaments">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments List
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="outline" onClick={() => router.push('/admin/tournaments')} className="transform hover:scale-105 transition-transform">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments List
      </Button>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Tournament: {tournament.name}</CardTitle>
          <CardDescription>Update the details of the existing tournament. All fields are required unless marked optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <TournamentForm
            onSubmit={handleFormSubmit}
            initialData={tournament}
            games={gamesList}
            onCancel={() => router.push('/admin/tournaments')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
