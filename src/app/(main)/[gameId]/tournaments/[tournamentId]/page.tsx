// src/app/(main)/[gameId]/tournaments/[tournamentId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getTournamentById, type Tournament } from '@/data/tournaments';
import { getGameById, type Game } from '@/data/games';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { InfoItem } from '@/components/tournament/InfoItem';
import { TournamentEnrollButton } from '@/components/tournament/TournamentEnrollButton';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarDays, Clock, DollarSign, Trophy, Gamepad2, Users, InfoIcon, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import type { UserRegion } from '@/data/users';


export default function TournamentDetailsPage() {
  const { gameId, tournamentId } = useParams<{ gameId: string, tournamentId: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);
  const [game, setGame] = useState<Game | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading, isLoggedIn } = useAuth();

  const fetchData = useCallback(async () => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!tournamentId || !gameId) {
      console.error("TournamentDetailsPage: Tournament ID or Game ID is missing.");
      setTournament(null);
      setGame(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const foundTournament = await getTournamentById(tournamentId);
      const foundGame = await getGameById(gameId);

      if (!foundTournament || !foundGame || foundTournament.gameId !== foundGame.id) {
        setTournament(null);
        setGame(null);
        setIsLoading(false);
        return; 
      }
      
      // Validate tournament region - it must be one of the expected values
      if (foundTournament.region !== 'USA' && foundTournament.region !== 'INDIA') {
        console.warn(`TournamentDetailsPage: Tournament ${foundTournament.id} has an invalid or missing region: ${foundTournament.region}. Treating as not found.`);
        setTournament(null);
        setGame(null);
        setIsLoading(false);
        return;
      }
      
      setTournament(foundTournament);
      setGame(foundGame);

    } catch (error) {
      console.error("TournamentDetailsPage: Failed to fetch tournament details:", error);
      setTournament(null);
      setGame(null);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, gameId, authLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Spinner size="large" />
        <p className="ml-3 text-muted-foreground">Loading tournament details...</p>
      </div>
    );
  }

  if (!tournament || !game) {
    notFound();
    return null;
  }

  // Determine the region context for this page: if user logged in, use their region, else default to USA
  const currentUserEffectiveRegion = isLoggedIn && user ? user.region : 'USA';
  
  // If user is logged in and their region doesn't match tournament's region, OR
  // if user is not logged in and tournament is not for 'USA' region (default public view)
  // then show a specific message allowing view but disallowing enrollment via button logic.
  // The button will handle the "Not in your region" display.

  const spotsProgress = tournament.totalSpots > 0 ? (tournament.totalSpots - tournament.spotsLeft) / tournament.totalSpots * 100 : 0;

  const formatDateDisplay = (dateString: string | undefined, includeTime = true) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      const formatString = includeTime ? "MMM d, yyyy, HH:mm" : "MMM d, yyyy";
      return format(date, formatString);
    } catch (e) {
      console.warn("Error formatting date:", dateString, e);
      return dateString;
    }
  };

  const entryFeeDisplay = formatCurrency(tournament.entryFee, tournament.entryFeeCurrency);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <Button asChild variant="outline" className="transform hover:scale-105 transition-transform">
        <Link href={`/${game.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {game.name}
        </Link>
      </Button>

      <Card className="shadow-2xl bg-card/80 backdrop-blur-sm hover:shadow-primary/20 transition-shadow duration-300 overflow-hidden rounded-xl hover:bg-card/70 hover:backdrop-blur-md">
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-x-5 md:gap-y-6 items-start">
            <div className="md:col-span-1 animate-in fade-in slide-in-from-left-8 duration-500 delay-100">
              <Image
                src={tournament.imageUrl || `https://placehold.co/500x350.png`}
                alt={`Banner for ${tournament.name}`}
                width={500}
                height={350}
                className="rounded-xl shadow-xl object-cover w-full aspect-video md:aspect-[4/3] transition-transform duration-300 hover:scale-105"
                data-ai-hint={tournament.dataAiHint}
              />
            </div>

            <div className="md:col-span-2 space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-right-8 duration-500 delay-200">
              <header className="mb-1 sm:mb-1.5">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-foreground mb-0.5 sm:mb-1">
                  {tournament.name}
                </h1>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="mr-1.5 h-4 w-4 text-primary/80"/> Region: <Badge variant="secondary" className="ml-1.5">{tournament.region}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Part of the <Link href={`/${game.id}`} className="text-primary hover:underline font-semibold">{game.name}</Link> series.
                </p>
              </header>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  <InfoItem icon={CalendarDays} label="Tournament Date" value={formatDateDisplay(tournament.tournamentDate)} />
                  <InfoItem icon={Clock} label="Registration Closes" value={formatDateDisplay(tournament.registrationCloseDate, false)} />
                  <InfoItem icon={DollarSign} label="Entry Fee" value={entryFeeDisplay} />
                  <InfoItem icon={Trophy} label="Prize Pool" value={tournament.prizePool} />
                  <InfoItem icon={Gamepad2} label="Game" value={game.name} link={`/${game.id}`} />
                </div>

                <Separator className="bg-border/50 my-2 sm:my-2.5"/>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center">
                    <Users className="mr-2 h-4 w-4 text-primary" />
                    Participants
                  </h3>
                  <div className="flex items-center justify-between text-muted-foreground mb-1 text-xs">
                    <span>{tournament.totalSpots - tournament.spotsLeft} / {tournament.totalSpots} registered</span>
                    <span>{tournament.spotsLeft} spots remaining</span>
                  </div>
                  <Progress value={spotsProgress} className="h-1.5 sm:h-2 rounded-full bg-muted/50" />
                </div>

                <div className="pt-1 sm:pt-1.5">
                  <TournamentEnrollButton
                    tournamentId={tournament.id}
                    gameId={game.id}
                    spotsLeft={tournament.spotsLeft}
                    tournamentName={tournament.name}
                    entryFee={tournament.entryFee}
                    tournamentRegion={tournament.region}
                    tournamentCurrency={tournament.entryFeeCurrency}
                    currentUserRegion={currentUserEffectiveRegion}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-3 sm:my-4 bg-border/50" />

      <section className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-primary/15 transition-shadow duration-300 rounded-xl hover:bg-card/70 hover:backdrop-blur-md">
          <CardContent className="p-3 sm:p-4">
            <h2 className="text-md sm:text-lg font-bold flex items-center text-foreground mb-2">
              <InfoIcon className="mr-2 h-5 w-5 text-primary" />
              Tournament Overview
            </h2>
            <div className="prose prose-xs sm:prose-sm max-w-none text-muted-foreground dark:prose-invert space-y-2">
              <p>
                Welcome to the <strong>{tournament.name}</strong>! This is a premier event for all <strong>{game.name}</strong> enthusiasts in the <strong>{tournament.region}</strong> region.
                Whether you are a seasoned pro or a newcomer looking to test your skills, this tournament offers a fair and exciting platform.
              </p>
              <p>
                The competition will take place on <strong>{formatDateDisplay(tournament.tournamentDate)}</strong>.
                Make sure to register before <strong>{formatDateDisplay(tournament.registrationCloseDate, false)}</strong>.
                Compete for an amazing prize pool including <strong>{tournament.prizePool}</strong>.
                The entry fee is set at <strong>{entryFeeDisplay}</strong>.
              </p>
              <p>
                We have a total of <strong>{tournament.totalSpots}</strong> slots available for participants.
                Currently, <strong>{tournament.spotsLeft} spots are still open</strong>, so be sure to register soon to secure your place.
                Prepare your strategies, practice your skills, and get ready for an unforgettable gaming experience!
              </p>
              <p>
                Good luck to all participants!
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
