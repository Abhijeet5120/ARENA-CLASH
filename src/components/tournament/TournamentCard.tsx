// src/components/tournament/TournamentCard.tsx
'use client';

import React from 'react';
import type { Tournament } from '@/data/tournaments';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { TournamentEnrollButton } from './TournamentEnrollButton';
import { CalendarDays, Clock, DollarSign, Trophy, Users, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { UserRegion } from '@/data/users';
import { cn } from '@/lib/utils';

interface TournamentCardProps {
  tournament: Tournament;
  currentUserRegion: UserRegion;
}

// Use React.memo for performance optimization
const TournamentCardComponent = ({ tournament: initialTournament, currentUserRegion }: TournamentCardProps) => {
  const tournament = initialTournament;

  const spotsProgress = React.useMemo(() =>
    tournament.totalSpots > 0 ? (tournament.totalSpots - tournament.spotsLeft) / tournament.totalSpots * 100 : 0
  , [tournament.totalSpots, tournament.spotsLeft]);

  const formatDate = React.useCallback((dateString: string, includeTime = true) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString); // Using new Date() directly for ISO strings is generally safe
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      const formatString = includeTime ? "MMM d, yyyy, HH:mm" : "MMM d, yyyy";
      return format(date, formatString);
    } catch (e) {
      return dateString; // Fallback for invalid dates
    }
  }, []);

  const entryFeeDisplay = React.useMemo(() =>
    formatCurrency(tournament.entryFee, tournament.entryFeeCurrency)
  , [tournament.entryFee, tournament.entryFeeCurrency]);

  return (
    <Card className={cn(
        "overflow-hidden shadow-lg hover:shadow-primary/30 transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 flex flex-col h-full bg-card/80 backdrop-blur-sm group hover:ring-2 focus-within:ring-2 focus-within:ring-primary rounded-xl",
        tournament.isSpecial
          ? "border-2 border-amber-500/80 hover:ring-amber-400/70 focus-within:ring-amber-400 bg-gradient-to-br from-card via-amber-500/15 to-amber-500/20 shadow-lg shadow-amber-500/10" // Increased gradient opacity and added themed shadow
          : "hover:ring-primary/70"
      )}>
      <Link href={`/${tournament.gameId}/tournaments/${tournament.id}`} className="group block flex flex-col h-full focus:outline-none">
        <CardHeader className="p-0 relative">
          <Image
            src={tournament.imageUrl || `https://placehold.co/400x224.png`}
            alt={`${tournament.name} visual`}
            width={400}
            height={224}
            className="w-full h-44 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={tournament.dataAiHint}
            priority={false}
          />
          <div className="absolute top-1.5 right-1.5 bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full text-xs font-semibold shadow-md backdrop-blur-sm">
            {tournament.spotsLeft} Spots Left
          </div>
           {tournament.isSpecial && (
            <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg flex items-center animate-breathing-soft">
              <Sparkles className="mr-1 h-3 w-3 fill-white" /> SPECIAL
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 sm:p-4 flex-grow">
          <CardTitle className={cn(
              "text-base sm:text-lg font-bold mb-1.5 sm:mb-2 text-foreground group-hover:text-primary transition-colors",
              tournament.isSpecial && "text-amber-400 group-hover:text-amber-300 drop-shadow-[0_2px_4px_rgba(251,191,36,0.6)]"
            )}>
            {tournament.name}
          </CardTitle>

          <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
              <span>{formatDate(tournament.tournamentDate)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
              <span>Reg. Closes: {formatDate(tournament.registrationCloseDate, false)}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
              <span>Entry: {entryFeeDisplay}</span>
            </div>
            <div className="flex items-center">
              <Trophy className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
              <span className="truncate" title={tournament.prizePool}>{tournament.prizePool.length > 20 ? tournament.prizePool.substring(0,17) + '...' : tournament.prizePool}</span>
            </div>
            <div className="flex items-center">
              <Users className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
              <span>{tournament.totalSpots - tournament.spotsLeft} / {tournament.totalSpots} Filled</span>
            </div>
          </div>
          <Progress
            value={spotsProgress}
            className={cn(
              "w-full mt-2.5 sm:mt-3 h-1.5 sm:h-2 bg-muted/60 rounded-full",
              tournament.isSpecial && "[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500"
            )}
          />

        </CardContent>
        <CardFooter className="p-3 sm:p-4 pt-0 mt-auto">
           <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="w-full">
            <TournamentEnrollButton
                tournamentId={tournament.id}
                gameId={tournament.gameId}
                spotsLeft={tournament.spotsLeft}
                tournamentName={tournament.name}
                entryFee={tournament.entryFee}
                tournamentRegion={tournament.region}
                tournamentCurrency={tournament.entryFeeCurrency}
                currentUserRegion={currentUserRegion}
            />
           </div>
        </CardFooter>
      </Link>
    </Card>
  );
};

export const TournamentCard = React.memo(TournamentCardComponent);
