// src/app/(admin)/admin/tournaments/schedule-daily/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllGames, getGameById, type Game, type DailyTournamentTemplate } from '@/data/games';
import { addTournament, type CreateTournamentData } from '@/data/tournaments'; // Import addTournament
import { useToast } from '@/hooks/use-toast';
import { useAdminContext } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, CalendarRange, Gamepad2, ListChecks, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { format, addDays, eachDayOfInterval, setHours, setMinutes, subHours } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ScheduleDailyTournamentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [selectedGameDetails, setSelectedGameDetails] = useState<Game | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 6); // Default to 7 days from today (inclusive)
    return date;
  });
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingGameDetails, setIsLoadingGameDetails] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      setIsLoadingGames(true);
      try {
        const fetchedGames = await getAllGames();
        setGames(fetchedGames);
      } catch (error) {
        toast({ title: "Error", description: "Could not load games list.", variant: "destructive" });
      } finally {
        setIsLoadingGames(false);
      }
    };
    fetchGames();
  }, [toast]);

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!selectedGameId) {
        setSelectedGameDetails(null);
        setSelectedTemplateIds(new Set());
        return;
      }
      setIsLoadingGameDetails(true);
      try {
        const gameData = await getGameById(selectedGameId);
        setSelectedGameDetails(gameData);
        setSelectedTemplateIds(new Set()); 
      } catch (error) {
        toast({ title: "Error", description: "Could not load details for the selected game.", variant: "destructive" });
        setSelectedGameDetails(null);
      } finally {
        setIsLoadingGameDetails(false);
      }
    };
    fetchGameDetails();
  }, [selectedGameId, toast]);
  
  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const handleScheduleTournaments = async () => {
    if (!selectedGameId || !selectedGameDetails || selectedTemplateIds.size === 0 || !startDate || !endDate) {
      toast({ title: "Missing Information", description: "Please select a game, templates, start date, and end date.", variant: "destructive" });
      return;
    }
    if (endDate < startDate) {
        toast({ title: "Invalid Date Range", description: "End date cannot be before start date.", variant: "destructive" });
        return;
    }

    setIsScheduling(true);
    let successfulCreations = 0;
    let failedCreations = 0;
    const errorMessages: string[] = [];

    const datesToSchedule = eachDayOfInterval({ start: startDate, end: endDate });

    for (const currentDate of datesToSchedule) {
      for (const templateId of Array.from(selectedTemplateIds)) {
        const templateDetails = selectedGameDetails.dailyTournamentTemplates?.find(t => t.id === templateId);
        if (!templateDetails) {
          console.warn(`Template with ID ${templateId} not found for game ${selectedGameDetails.name}. Skipping.`);
          failedCreations++;
          errorMessages.push(`Template ${templateId} not found.`);
          continue;
        }

        try {
          const [hours, minutes] = templateDetails.tournamentTime.split(':').map(Number);
          let tournamentDateTime = setMinutes(setHours(currentDate, hours), minutes);
          
          // Ensure tournamentDateTime is not in the past relative to now for the first day
          if (currentDate.toDateString() === new Date().toDateString() && tournamentDateTime < new Date()) {
              console.warn(`Skipping template "${templateDetails.templateName}" for ${format(currentDate, 'MMM d')} as its time (${templateDetails.tournamentTime}) is in the past.`);
              errorMessages.push(`Skipped ${templateDetails.templateName} on ${format(currentDate, 'MMM d')} (time past).`);
              failedCreations++;
              continue;
          }


          const registrationCloseDateTime = subHours(tournamentDateTime, templateDetails.registrationCloseOffsetHours);

          const tournamentName = `${templateDetails.templateName} - ${format(currentDate, 'MMM d')}`;

          const createData: CreateTournamentData = {
            name: tournamentName,
            gameId: selectedGameDetails.id,
            gameModeId: templateDetails.gameModeId,
            isSpecial: false, // Daily tournaments are not special by default
            tournamentDate: tournamentDateTime.toISOString(),
            registrationCloseDate: registrationCloseDateTime.toISOString(),
            entryFee: templateDetails.entryFee,
            entryFeeCurrency: adminSelectedRegion === 'INDIA' ? 'INR' : 'USD',
            region: adminSelectedRegion,
            prizePool: templateDetails.prizePool,
            totalSpots: templateDetails.totalSpots,
            imageUrl: templateDetails.imageUrl || `https://placehold.co/400x250.png?text=${encodeURIComponent(tournamentName)}`, // Fallback if template has no image
          };

          await addTournament(createData);
          successfulCreations++;
        } catch (error: any) {
          failedCreations++;
          const errorMessage = `Failed to create "${templateDetails.templateName}" for ${format(currentDate, 'MMM d')}: ${error.message || 'Unknown error'}`;
          console.error(errorMessage, error);
          errorMessages.push(errorMessage.substring(0, 100)); // Keep error messages brief for toast
        }
      }
    }

    toast({
      title: "Scheduling Complete",
      description: `${successfulCreations} tournament(s) created. ${failedCreations} failed. ${failedCreations > 0 ? 'Check console for details or individual error messages: ' + errorMessages.slice(0,2).join('; ') + '...' : ''}`,
      duration: failedCreations > 0 ? 10000 : 5000,
      variant: failedCreations > 0 && successfulCreations === 0 ? "destructive" : (failedCreations > 0 ? "default" : "default") // Destructive if all failed
    });

    if (successfulCreations > 0) {
      setSelectedTemplateIds(new Set()); // Clear selection on success
    }
    setIsScheduling(false);
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="outline" asChild className="transform hover:scale-105 transition-transform">
        <Link href="/admin/tournaments">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments List
        </Link>
      </Button>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-primary/15 transition-shadow duration-300 rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <CalendarClock className="mr-3 h-7 w-7 text-primary" />
            Schedule Daily Tournaments (for {adminSelectedRegion} Region)
          </CardTitle>
          <CardDescription>
            Select a game, choose templates, set a date range, and automatically schedule recurring daily tournaments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Selection */}
          <div className="space-y-2">
            <Label htmlFor="game-select" className="flex items-center"><Gamepad2 className="mr-2 h-4 w-4 text-muted-foreground" />Select Game</Label>
            {isLoadingGames ? (
              <div className="flex items-center"><Spinner size="small" className="mr-2"/> Loading games...</div>
            ) : (
              <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                <SelectTrigger id="game-select">
                  <SelectValue placeholder="Choose a game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map(game => (
                    <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center"><CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />Start Date</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
                disabledDates={{before: today}}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="flex items-center"><CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />End Date</Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
                disabledDates={{before: startDate || today}}
                isPickerButtonDisabled={!startDate}
              />
               {!startDate && <p className="text-xs text-muted-foreground mt-1">Select a start date first.</p>}
            </div>
          </div>
          
          {/* Daily Tournament Templates List */}
          {selectedGameId && (
            <div className="space-y-3">
              <Label className="flex items-center"><ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />Select Templates to Schedule (for {selectedGameDetails?.name || 'selected game'})</Label>
              {isLoadingGameDetails ? (
                <div className="flex items-center"><Spinner size="small" className="mr-2"/> Loading templates...</div>
              ) : selectedGameDetails && selectedGameDetails.dailyTournamentTemplates && selectedGameDetails.dailyTournamentTemplates.length > 0 ? (
                 <ScrollArea className="h-72 w-full rounded-md border bg-muted/20 p-4">
                    <div className="space-y-3">
                    {selectedGameDetails.dailyTournamentTemplates.map(template => (
                        <Card 
                            key={template.id} 
                            onClick={() => handleTemplateSelection(template.id)}
                            className={`p-3 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md 
                                        ${selectedTemplateIds.has(template.id) ? 'ring-2 ring-primary bg-primary/10 shadow-primary/20' : 'bg-background/50 hover:bg-muted/40'}`}
                        >
                        <div className="flex items-center justify-between">
                            <div className="flex-grow">
                                <h4 className="font-semibold text-foreground text-sm">{template.templateName}</h4>
                                <p className="text-xs text-muted-foreground">
                                Mode: {selectedGameDetails.gameModes.find(gm => gm.id === template.gameModeId)?.name || 'N/A'} | 
                                Time: {template.tournamentTime} | 
                                Fee: {template.entryFee} | 
                                Spots: {template.totalSpots}
                                </p>
                            </div>
                            {selectedTemplateIds.has(template.id) && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 ml-2" />}
                        </div>
                        </Card>
                    ))}
                    </div>
                </ScrollArea>
              ) : (
                <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                  <Info className="mx-auto h-8 w-8 mb-2 opacity-50"/>
                  No daily tournament templates found for {selectedGameDetails?.name || "this game"}. 
                  Add templates in the 'Manage Game' section.
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full sm:w-auto transform hover:scale-105 transition-transform"
            onClick={handleScheduleTournaments}
            disabled={isScheduling || !selectedGameId || selectedTemplateIds.size === 0 || !startDate || !endDate || isLoadingGameDetails}
          >
            {isScheduling ? <Spinner size="small" className="mr-2"/> : <CalendarClock className="mr-2 h-4 w-4" />}
            {isScheduling ? `Scheduling (${successfulCreations + failedCreations}/${datesToSchedule.length * selectedTemplateIds.size})...` : `Schedule Selected Templates (${selectedTemplateIds.size})`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
