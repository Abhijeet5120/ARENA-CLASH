// src/app/(admin)/admin/tournaments/schedule-daily/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllGames, type Game, type DailyTournamentTemplate } from '@/data/games';
import { addTournament, type CreateTournamentData } from '@/data/tournaments';
import { useToast } from '@/hooks/use-toast';
import { useAdminContext } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CalendarClock, Gamepad2, Info, CheckCircle, ImageOff, BadgeDollarSign, Users, Clock, Tag } from 'lucide-react';
import { format, setHours, setMinutes, startOfDay, subHours, parse } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface EnrichedDailyTournamentTemplate extends DailyTournamentTemplate {
  gameId: string;
  gameName: string;
  gameIconImageUrl?: string;
}

export default function ScheduleDailyTournamentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();

  const [allGamesData, setAllGamesData] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [displayedTemplates, setDisplayedTemplates] = useState<EnrichedDailyTournamentTemplate[]>([]);
  
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingTemplatesForSelectedGame, setIsLoadingTemplatesForSelectedGame] = useState(false);
  const [processingTemplateId, setProcessingTemplateId] = useState<string | null>(null);
  const [implementedTemplatesByGame, setImplementedTemplatesByGame] = useState<Record<string, string>>({});


  const loadGames = useCallback(async () => {
    setIsLoadingGames(true);
    try {
      const fetchedGames = await getAllGames();
      setAllGamesData(fetchedGames);
    } catch (error) {
      toast({ title: "Error Loading Games", description: "Could not load the list of games.", variant: "destructive" });
      setAllGamesData([]);
    } finally {
      setIsLoadingGames(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  useEffect(() => {
    if (!selectedGameId) {
      setDisplayedTemplates([]);
      return;
    }

    setIsLoadingTemplatesForSelectedGame(true);
    const selectedGame = allGamesData.find(game => game.id === selectedGameId);

    if (selectedGame) {
      const enrichedTemplates: EnrichedDailyTournamentTemplate[] = (selectedGame.dailyTournamentTemplates || []).map(template => ({
        ...template,
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        gameIconImageUrl: selectedGame.iconImageUrl,
      }));

      enrichedTemplates.sort((a, b) => {
        try {
            const timeA = parse(a.tournamentTime, 'HH:mm', new Date());
            const timeB = parse(b.tournamentTime, 'HH:mm', new Date());
            if (timeA < timeB) return -1;
            if (timeA > timeB) return 1;
        } catch (e) {
            // fallback to name sort if time parsing fails
        }
        if (a.templateName.toLowerCase() < b.templateName.toLowerCase()) return -1;
        if (a.templateName.toLowerCase() > b.templateName.toLowerCase()) return 1;
        return 0;
      });
      setDisplayedTemplates(enrichedTemplates);
    } else {
      setDisplayedTemplates([]);
    }
    setIsLoadingTemplatesForSelectedGame(false);
  }, [allGamesData, selectedGameId]);


  const handleImplementTemplate = async (template: EnrichedDailyTournamentTemplate) => {
    setProcessingTemplateId(template.id);

    try {
      const [hours, minutes] = template.tournamentTime.split(':').map(Number);
      const today = new Date();
      let tournamentDateTime = setMinutes(setHours(startOfDay(today), hours), minutes); 

      if (tournamentDateTime < new Date()) {
        toast({
          title: "Time Passed",
          description: `The time for "${template.templateName}" (${template.tournamentTime}) has already passed for today.`,
          variant: "destructive",
        });
        setProcessingTemplateId(null);
        return;
      }

      const registrationCloseDateTime = subHours(tournamentDateTime, template.registrationCloseOffsetHours);
      const tournamentName = `${template.templateName} - Daily - ${format(today, 'MMM d')}`;
      const entryFeeCurrencyForTournament = adminSelectedRegion === 'INDIA' ? 'INR' : 'USD';

      const createData: CreateTournamentData = {
        name: tournamentName,
        gameId: template.gameId,
        gameModeId: template.gameModeId,
        isSpecial: false, 
        tournamentDate: tournamentDateTime.toISOString(),
        registrationCloseDate: registrationCloseDateTime.toISOString(),
        entryFee: template.entryFee,
        entryFeeCurrency: entryFeeCurrencyForTournament,
        region: adminSelectedRegion,
        prizePool: template.prizePool,
        totalSpots: template.totalSpots,
        imageUrl: template.imageUrl || `https://placehold.co/400x250.png?text=${encodeURIComponent(tournamentName)}`,
      };

      await addTournament(createData);
      toast({
        title: "Tournament Scheduled!",
        description: `"${tournamentName}" for ${template.gameName} has been scheduled for today.`,
        variant: "default",
      });
      setImplementedTemplatesByGame(prev => ({ ...prev, [template.gameId]: template.id }));

    } catch (error: any) {
      toast({
        title: "Scheduling Failed",
        description: error.message || `Could not schedule "${template.templateName}".`,
        variant: "destructive",
      });
    } finally {
      setProcessingTemplateId(null);
    }
  };

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
            Select a game, then choose from its predefined daily templates to schedule for today. Only one template per game can be implemented for today.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="game-select">Select Game</Label>
            <Select 
              value={selectedGameId} 
              onValueChange={(value) => {
                setSelectedGameId(value);
                // implementedTemplatesByGame persists across game changes in the same session
                setProcessingTemplateId(null); 
              }}
              disabled={isLoadingGames}
            >
              <SelectTrigger id="game-select" className="bg-background/50">
                <SelectValue placeholder="Choose a game..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingGames && allGamesData.length === 0 ? (
                  <SelectItem value="loading" disabled>Loading games...</SelectItem>
                ) : allGamesData.length > 0 ? (
                  allGamesData.map(game => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-games" disabled>No games available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {isLoadingGames ? (
            <div className="flex items-center justify-center h-40"><Spinner size="large" /><p className="ml-3 text-muted-foreground">Loading games list...</p></div>
          ) : !selectedGameId ? (
            <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground">
              <Info className="mx-auto h-10 w-10 mb-3 opacity-50"/>
              <p className="font-semibold">Please select a game to view its daily templates.</p>
            </div>
          ) : isLoadingTemplatesForSelectedGame ? (
             <div className="flex items-center justify-center h-40"><Spinner size="large" /><p className="ml-3 text-muted-foreground">Loading templates for {allGamesData.find(g => g.id === selectedGameId)?.name || 'selected game'}...</p></div>
          ) : displayedTemplates.length === 0 ? (
            <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground">
              <Info className="mx-auto h-10 w-10 mb-3 opacity-50"/>
              <p className="font-semibold">
                No Daily Templates for {allGamesData.find(g => g.id === selectedGameId)?.name || 'Selected Game'}
              </p>
              <p className="text-sm">Please create templates in the "Manage Game" section for this game.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayedTemplates.map(template => {
                const isProcessingThis = processingTemplateId === template.id;
                const isAnotherProcessing = !!processingTemplateId && processingTemplateId !== template.id;
                const gameAlreadyScheduledToday = !!implementedTemplatesByGame[template.gameId];
                const thisTemplateImplementedToday = implementedTemplatesByGame[template.gameId] === template.id;

                let buttonText = "Implement for Today";
                if (isProcessingThis) {
                  buttonText = "Implementing...";
                } else if (thisTemplateImplementedToday) {
                  buttonText = "Implemented for Today";
                } else if (gameAlreadyScheduledToday) {
                  buttonText = "Game Scheduled Today"; // Or keep as "Implement for Today" if you prefer generic disabled text
                }
                
                return (
                  <Card key={template.id} className="flex flex-col bg-muted/20 backdrop-blur-sm shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden">
                    <CardHeader className="p-0 relative">
                      {template.imageUrl ? (
                        <Image
                          src={template.imageUrl}
                          alt={`${template.templateName} banner`}
                          width={400}
                          height={180}
                          className="w-full h-32 object-cover"
                          data-ai-hint={`${template.gameName} tournament template`}
                        />
                      ) : (
                        <div className="w-full h-32 bg-muted/40 flex items-center justify-center">
                          <ImageOff className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md shadow flex items-center">
                        {template.gameIconImageUrl ? (
                          <Image src={template.gameIconImageUrl} alt={template.gameName} width={16} height={16} className="h-4 w-4 mr-1.5 rounded-sm object-contain"/>
                        ) : (
                          <Gamepad2 className="h-4 w-4 mr-1.5 text-primary"/>
                        )}
                        <span className="text-xs font-medium text-foreground">{template.gameName}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                      <h3 className="text-md font-semibold text-foreground mb-2 truncate" title={template.templateName}>{template.templateName}</h3>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center"><Clock className="mr-1.5 h-3.5 w-3.5 text-primary/80"/>Time: {template.tournamentTime}</div>
                        <div className="flex items-center"><BadgeDollarSign className="mr-1.5 h-3.5 w-3.5 text-primary/80"/>Fee: {template.entryFee} (as {adminSelectedRegion === "INDIA" ? "INR" : "USD"})</div>
                        <div className="flex items-center"><Users className="mr-1.5 h-3.5 w-3.5 text-primary/80"/>Spots: {template.totalSpots}</div>
                        <div className="flex items-center"><Tag className="mr-1.5 h-3.5 w-3.5 text-primary/80"/>Mode: {allGamesData.flatMap(g => g.gameModes).find(gm => gm.id === template.gameModeId)?.name || template.gameModeId}</div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t border-border/30">
                      <Button
                        className="w-full transform hover:scale-105 transition-transform"
                        onClick={() => handleImplementTemplate(template)}
                        disabled={
                          isProcessingThis ||
                          isAnotherProcessing ||
                          (gameAlreadyScheduledToday && !thisTemplateImplementedToday) || // Disable if game is scheduled but not by this template
                          thisTemplateImplementedToday // Disable if this specific template was already implemented
                        }
                      >
                        {isProcessingThis ? (
                          <Spinner size="small" className="mr-2"/>
                        ) : thisTemplateImplementedToday ? (
                          <CheckCircle className="mr-2 h-4 w-4"/>
                        ) : (
                          <CalendarClock className="mr-2 h-4 w-4" />
                        )}
                        {buttonText}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
