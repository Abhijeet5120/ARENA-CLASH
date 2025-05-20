// src/app/(admin)/admin/tournaments/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAllTournaments,
  deleteTournament,
  type Tournament,
} from '@/data/tournaments';
import { getAllGames, type Game } from '@/data/games';
import { useToast } from '@/hooks/use-toast';
import { useAdminContext } from '@/context/AdminContext';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from '@/components/ui/spinner';
import { format, parseISO, isValid } from 'date-fns';
import { PlusCircle, Search, Users, Edit3, Trash2, CalendarClock, Settings, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';


export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const { adminSelectedRegion } = useAdminContext();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedTournaments, fetchedGames] = await Promise.all([
        getAllTournaments(adminSelectedRegion),
        getAllGames()
      ]);
      setTournaments(fetchedTournaments);
      setGames(fetchedGames);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: 'Error', description: 'Failed to load tournaments or games.', variant: 'destructive' });
      setTournaments([]);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, adminSelectedRegion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (tournamentId: string) => {
    try {
      const success = await deleteTournament(tournamentId);
      if (success) {
        toast({ title: 'Success', description: 'Tournament deleted successfully.' });
        await loadData();
      } else {
        throw new Error('Failed to delete tournament. It might have already been deleted or not found.');
      }
    } catch (error: any) {
      console.error("Error deleting tournament:", error);
      toast({ title: 'Error', description: error.message || 'Failed to delete tournament.', variant: 'destructive' });
    }
  };

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (games.find(g => g.id === tournament.gameId)?.name.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getGameName = (gameId: string) => games.find(g => g.id === gameId)?.name || 'Unknown Game';

  const formatDateDisplay = (dateString: string | undefined, includeTime = true) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return "Invalid Date";
      }
      const formatString = includeTime ? "MMM d, yyyy, HH:mm" : "MMM d, yyyy"; // Removed zzz for simplicity with local time
      return format(date, formatString);
    } catch (e) {
      console.warn("Error formatting date:", dateString, e);
      return dateString;
    }
  };

  const getTournamentCurrencyDisplay = (tournament: Tournament) => {
    return adminSelectedRegion === 'INDIA' ? 'INR' : tournament.entryFeeCurrency;
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Tournaments ({adminSelectedRegion})</h1>
          <p className="text-muted-foreground">Create custom tournaments or schedule daily recurring events for the selected region.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
           <Button 
            asChild 
            className="w-full sm:w-auto transform hover:scale-105 transition-transform rounded-lg"
            variant="outline"
           >
            <Link href="/admin/tournaments/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Custom Tournament
            </Link>
          </Button>
          <Button 
            asChild
            className="w-full sm:w-auto transform hover:scale-105 transition-transform rounded-lg"
            // onClick={() => toast({ title: "Coming Soon!", description: "Functionality to schedule daily tournaments is under development." })}
          >
            <Link href="/admin/tournaments/schedule-daily">
              <CalendarClock className="mr-2 h-5 w-5" /> Schedule Daily Tournaments
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        <Input
          type="search"
          placeholder="Search tournaments by name or game..."
          className="w-full pl-10 shadow-sm bg-background/70 backdrop-blur-sm rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Spinner size="large" />
          <p className="ml-4 text-muted-foreground">Loading tournaments for {adminSelectedRegion}...</p>
        </div>
      ) : (
        <div className="bg-card/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Tournament Date</TableHead>
                <TableHead>Reg. Close Date</TableHead>
                <TableHead className="text-right">Entry Fee</TableHead>
                <TableHead className="text-right">Spots (Left/Total)</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTournaments.length > 0 ? filteredTournaments.map((tournament) => (
                <TableRow key={tournament.id} className="hover:bg-muted/40 hover:backdrop-blur-sm transition-colors duration-150">
                  <TableCell className="font-medium">{tournament.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getGameName(tournament.gameId)}</Badge>
                    {tournament.isSpecial && <Badge variant="default" className="ml-2 bg-amber-500 hover:bg-amber-600">Special</Badge>}
                  </TableCell>
                  <TableCell>{formatDateDisplay(tournament.tournamentDate)}</TableCell>
                  <TableCell>{formatDateDisplay(tournament.registrationCloseDate, false)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(tournament.entryFee, getTournamentCurrencyDisplay(tournament))}</TableCell>
                  <TableCell className="text-right">{tournament.spotsLeft}/{tournament.totalSpots}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label="View enrollments" className="group">
                        <Link href={`/admin/tournaments/${tournament.id}/enrollments`}>
                          <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild aria-label="Edit tournament" className="group">
                        <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                          <Edit3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Delete tournament" className="group">
                            <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card/90 backdrop-blur-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the tournament
                              "{tournament.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(tournament.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No tournaments found for {adminSelectedRegion}. Create one to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
