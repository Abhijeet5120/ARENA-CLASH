// src/app/(admin)/admin/tournaments/schedule-daily/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllGames, getGameById, type Game, type DailyTournamentTemplate } from '@/data/games';
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
import { format } from 'date-fns';
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
    date.setDate(date.getDate() + 6); // Default to 7 days from today
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
        if (fetchedGames.length > 0 && !selectedGameId) {
          // Optionally auto-select the first game
          // setSelectedGameId(fetchedGames[0].id);
        }
      } catch (error) {
        toast({ title: "Error", description: "Could not load games list.", variant: "destructive" });
      } finally {
        setIsLoadingGames(false);
      }
    };
    fetchGames();
  }, [toast, selectedGameId]);

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
        setSelectedTemplateIds(new Set()); // Reset selected templates when game changes
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
    // Placeholder for actual scheduling logic
    // In a real scenario, this would loop through dates and templates,
    // then call addTournament for each.
    console.log("Scheduling for game:", selectedGameDetails.name);
    console.log("Region:", adminSelectedRegion);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("Selected Templates:", Array.from(selectedTemplateIds));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Scheduling Initiated (Placeholder)",
      description: `Daily tournaments for ${selectedGameDetails.name} from ${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')} for the ${adminSelectedRegion} region. (Actual creation not yet implemented)`,
      duration: 7000,
    });
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
              <Label className="flex items-center"><ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />Select Templates to Schedule</Label>
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
            {isScheduling ? 'Scheduling...' : `Schedule Selected Templates (${selectedTemplateIds.size})`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
