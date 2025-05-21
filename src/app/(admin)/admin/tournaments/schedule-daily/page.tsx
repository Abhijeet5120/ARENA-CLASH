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
import { ArrowLeft, CalendarClock, Gamepad2, ListChecks, AlertTriangle, CheckCircle, Info, Tag, Clock, Users, DollarSign, ImageOff, BadgeDollarSign } from 'lucide-react';
import { format, setHours, setMinutes, subHours } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';

interface EnrichedDailyTournamentTemplate extends DailyTournamentTemplate {
  gameId: string;
  gameName: string;
  gameIconImageUrl?: string;
}

export default function ScheduleDailyTournamentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();

  const [allEnrichedTemplates, setAllEnrichedTemplates] = useState<EnrichedDailyTournamentTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [processingTemplateId, setProcessingTemplateId] = useState<string | null>(null);
  const [implementedTodaySet, setImplementedTodaySet] = useState<Set<string>>(new Set());

  const loadAllTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const fetchedGames = await getAllGames();
      const enrichedTemplates: EnrichedDailyTournamentTemplate[] = [];
      fetchedGames.forEach(game => {
        (game.dailyTournamentTemplates || []).forEach(template => {
          enrichedTemplates.push({
            ...template,
            gameId: game.id,
            gameName: game.name,
            gameIconImageUrl: game.iconImageUrl,
          });
        });
      });
      // Sort templates, perhaps by game name then template name
      enrichedTemplates.sort((a, b) => {
        if (a.gameName.toLowerCase() < b.gameName.toLowerCase()) return -1;
        if (a.gameName.toLowerCase() > b.gameName.toLowerCase()) return 1;
        if (a.templateName.toLowerCase() < b.templateName.toLowerCase()) return -1;
        if (a.templateName.toLowerCase() > b.templateName.toLowerCase()) return 1;
        return 0;
      });
      setAllEnrichedTemplates(enrichedTemplates);
    } catch (error) {
      toast({ title: "Error", description: "Could not load daily tournament templates.", variant: "destructive" });
      setAllEnrichedTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllTemplates();
  }, [loadAllTemplates]);

  const handleImplementTemplate = async (template: EnrichedDailyTournamentTemplate) => {
    setProcessingTemplateId(template.id);

    try {
      const [hours, minutes] = template.tournamentTime.split(':').map(Number);
      const today = new Date();
      let tournamentDateTime = setMinutes(setHours(new Date(today.getFullYear(), today.getMonth(), today.getDate()), hours), minutes);

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
      setImplementedTodaySet(prev => new Set(prev).add(template.id));

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
            Implement predefined daily tournament templates for today. Tournaments will be created for the <span className="font-semibold">{adminSelectedRegion}</span> region using the region's currency for entry fees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingTemplates ? (
            <div className="flex items-center justify-center h-40"><Spinner size="large" /><p className="ml-3 text-muted-foreground">Loading templates...</p></div>
          ) : allEnrichedTemplates.length === 0 ? (
            <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground">
              <Info className="mx-auto h-10 w-10 mb-3 opacity-50"/>
              <p className="font-semibold">No Daily Tournament Templates Found</p>
              <p className="text-sm">Please create some templates in the "Manage Game" section for any game first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {allEnrichedTemplates.map(template => (
                <Card key={template.id} className="flex flex-col bg-muted/20 backdrop-blur-sm shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden">
                  <CardHeader className="p-0 relative">
                    {template.imageUrl ? (
                      <Image
                        src={template.imageUrl}
                        alt={`${template.templateName} banner`}
                        width={400}
                        height={180}
                        className="w-full h-32 object-cover"
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
                      <div className="flex items-center"><Tag className="mr-1.5 h-3.5 w-3.5 text-primary/80"/>Mode: {template.gameModeId}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 border-t border-border/30">
                    <Button
                      className="w-full transform hover:scale-105 transition-transform"
                      onClick={() => handleImplementTemplate(template)}
                      disabled={
                        processingTemplateId === template.id ||
                        (!!processingTemplateId && processingTemplateId !== template.id) ||
                        implementedTodaySet.has(template.id)
                      }
                    >
                      {processingTemplateId === template.id ? (
                        <Spinner size="small" className="mr-2"/>
                      ) : implementedTodaySet.has(template.id) ? (
                        <CheckCircle className="mr-2 h-4 w-4"/>
                      ) : (
                        <CalendarClock className="mr-2 h-4 w-4" />
                      )}
                      {processingTemplateId === template.id
                        ? "Implementing..."
                        : implementedTodaySet.has(template.id)
                        ? "Implemented for Today"
                        : "Implement for Today"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
