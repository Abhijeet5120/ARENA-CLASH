// src/app/(admin)/admin/games/[gameId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGameById, updateGame, type Game, type GameMode, type DailyTournamentTemplate } from '@/data/games';
import { getTournamentsByGameId, type Tournament } from '@/data/tournaments';
import { useAdminContext } from '@/context/AdminContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
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
import {
  Dialog,
  DialogContent as DialogModalContent,
  DialogHeader as DialogModalHeader,
  DialogTitle as DialogModalTitle,
  DialogDescription as DialogModalDescription,
  DialogFooter as DialogModalFooter,
  DialogTrigger as DialogModalTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Edit3, ImageIcon as ImageIconLucide, Info, Palette, Layers, CloudUpload, Trash2, Save, BarChartBig, Users, DollarSign, ShieldPlus, Puzzle, PlusCircle, ExternalLink, ImagePlus, Edit, AlertTriangle, CalendarPlus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';


interface GameStats {
  tournamentCount: number;
  totalSpotsFilled: number;
  totalSpotsAvailable: number;
  totalEntryFeesCollected: number;
  regionCurrency: 'USD' | 'INR';
}

export default function AdminGameDetailsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();

  const [game, setGame] = useState<Game | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [description, setDescription] = useState('');
  const [themeGradient, setThemeGradient] = useState('');
  const [previewBannerUrl, setPreviewBannerUrl] = useState<string | null>(null);
  const [previewIconUrl, setPreviewIconUrl] = useState<string | null>(null);
  const [frequentBanners, setFrequentBanners] = useState<string[]>([]);

  // State for new game mode form
  const [isGameModeModalOpen, setIsGameModeModalOpen] = useState(false);
  const [newGameModeId, setNewGameModeId] = useState('');
  const [newGameModeName, setNewGameModeName] = useState('');
  const [newGameModeDescription, setNewGameModeDescription] = useState('');
  const [newGameModeIconUrl, setNewGameModeIconUrl] = useState('');
  const [newGameModeBannerUrl, setNewGameModeBannerUrl] = useState('');
  const [isSavingGameMode, setIsSavingGameMode] = useState(false);

  // State for editing game mode form
  const [isEditGameModeModalOpen, setIsEditGameModeModalOpen] = useState(false);
  const [currentEditingGameMode, setCurrentEditingGameMode] = useState<GameMode | null>(null);
  const [editGameModeName, setEditGameModeName] = useState('');
  const [editGameModeDescription, setEditGameModeDescription] = useState('');
  const [editGameModeIconUrl, setEditGameModeIconUrl] = useState<string | null>(null);
  const [editGameModeBannerUrl, setEditGameModeBannerUrl] = useState<string | null>(null);
  const [isUpdatingGameMode, setIsUpdatingGameMode] = useState(false);

  // State for new daily tournament template form
  const [isDailyTemplateModalOpen, setIsDailyTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateGameModeId, setNewTemplateGameModeId] = useState('');
  const [newTemplateEntryFee, setNewTemplateEntryFee] = useState<number>(0);
  const [newTemplatePrizePool, setNewTemplatePrizePool] = useState('');
  const [newTemplateImageUrl, setNewTemplateImageUrl] = useState<string | null>(null);
  const [newTemplateTotalSpots, setNewTemplateTotalSpots] = useState<number>(32);
  const [newTemplateTime, setNewTemplateTime] = useState('18:00'); 
  const [newTemplateRegOffset, setNewTemplateRegOffset] = useState<number>(2); 
  const [isSavingDailyTemplate, setIsSavingDailyTemplate] = useState(false);

  // State for editing daily tournament template form
  const [isEditDailyTemplateModalOpen, setIsEditDailyTemplateModalOpen] = useState(false);
  const [currentEditingTemplate, setCurrentEditingTemplate] = useState<DailyTournamentTemplate | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateGameModeId, setEditTemplateGameModeId] = useState('');
  const [editTemplateEntryFee, setEditTemplateEntryFee] = useState<number>(0);
  const [editTemplatePrizePool, setEditTemplatePrizePool] = useState('');
  const [editTemplateImageUrl, setEditTemplateImageUrl] = useState<string | null>(null);
  const [editTemplateTotalSpots, setEditTemplateTotalSpots] = useState<number>(32);
  const [editTemplateTime, setEditTemplateTime] = useState('18:00');
  const [editTemplateRegOffset, setEditTemplateRegOffset] = useState<number>(2);
  const [isUpdatingDailyTemplate, setIsUpdatingDailyTemplate] = useState(false);


  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const frequentBannerInputRef = useRef<HTMLInputElement>(null);
  const gameModeIconInputRef = useRef<HTMLInputElement>(null);
  const gameModeBannerInputRef = useRef<HTMLInputElement>(null);
  const editGameModeIconInputRef = useRef<HTMLInputElement>(null);
  const editGameModeBannerInputRef = useRef<HTMLInputElement>(null);
  const dailyTemplateBannerInputRef = useRef<HTMLInputElement>(null);
  const editDailyTemplateBannerInputRef = useRef<HTMLInputElement>(null);


  const loadGameData = useCallback(async () => {
    if (!gameId) {
      notFound();
      return;
    }
    setIsLoading(true);
    try {
      const fetchedGame = await getGameById(gameId);
      if (!fetchedGame) {
        notFound();
        return;
      }
      setGame(fetchedGame);
      setDescription(fetchedGame.description);
      setThemeGradient(fetchedGame.themeGradient);
      setFrequentBanners(fetchedGame.frequentlyUsedBanners || []);
      setPreviewBannerUrl(null);
      setPreviewIconUrl(null);

      const gameTournamentsInRegion = await getTournamentsByGameId(gameId, adminSelectedRegion);
      const tournamentCount = gameTournamentsInRegion.length;
      const totalSpotsFilled = gameTournamentsInRegion.reduce((sum, t) => sum + (t.totalSpots - t.spotsLeft), 0);
      const totalSpotsAvailable = gameTournamentsInRegion.reduce((sum, t) => sum + t.totalSpots, 0);
      let totalEntryFeesCollected = 0;
      gameTournamentsInRegion.forEach(t => {
        totalEntryFeesCollected += (t.totalSpots - t.spotsLeft) * t.entryFee;
      });

      const regionCurrency = adminSelectedRegion === 'INDIA' ? 'INR' : 'USD';
      setGameStats({ tournamentCount, totalSpotsFilled, totalSpotsAvailable, totalEntryFeesCollected, regionCurrency });

    } catch (error) {
      console.error("Failed to load game data:", error);
      toast({ title: "Error", description: "Failed to load game details.", variant: "destructive" });
      setGame(null);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, toast, adminSelectedRegion]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    setDataUriCallback: (uri: string | null) => void,
    options?: { maxSizeMB?: number; toastTitle?: string }
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
        setDataUriCallback(null);
        return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File Type', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (options?.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
      toast({ title: 'File Too Large', description: `Please select an image smaller than ${options.maxSizeMB}MB.`, variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDataUriCallback(reader.result as string);
      if (options?.toastTitle) {
        toast({ title: options.toastTitle, description: 'Preview updated. Save changes to apply.' });
      }
    };
    reader.onerror = () => {
      toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    };
    reader.readAsDataURL(file);
    if(event.target) event.target.value = '';
  };

  const handleGameBannerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event, setPreviewBannerUrl, { maxSizeMB: 10, toastTitle: 'Game Banner Preview Updated'});
  };

  const handleGameIconFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event, setPreviewIconUrl, { maxSizeMB: 1, toastTitle: 'Game Icon Preview Updated'});
  };

  const handleFrequentBannerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event, (uri) => {
      if (uri) setFrequentBanners(prev => [...prev, uri]);
    }, { maxSizeMB: 2, toastTitle: 'Frequent Banner Added'});
  };

  const handleDeleteFrequentBanner = (index: number) => {
    setFrequentBanners(prev => prev.filter((_, i) => i !== index));
    toast({ title: 'Frequent Banner Removed', description: 'Save changes to apply this deletion.' });
  };

  const handleSaveChanges = async () => {
    if (!game) {
      toast({ title: "Error", description: "No game data to save.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const updates: Partial<Omit<Game, 'id' | 'gameModes' | 'dailyTournamentTemplates'>> = {
        description: description,
        themeGradient: themeGradient,
        frequentlyUsedBanners: frequentBanners,
      };
      if (previewBannerUrl) {
        updates.bannerImageUrl = previewBannerUrl;
      }
      if (previewIconUrl) {
        updates.iconImageUrl = previewIconUrl;
      }

      const updatedGame = await updateGame(game.id, updates);
      if (updatedGame) {
        setGame(prevGame => prevGame ? ({...prevGame, ...updatedGame, gameModes: prevGame.gameModes, dailyTournamentTemplates: prevGame.dailyTournamentTemplates}) : null );
        setPreviewBannerUrl(null);
        setPreviewIconUrl(null);
        toast({
          title: "Success!",
          description: `${game.name} details updated successfully.`,
          variant: "default"
        });
        await loadGameData();
      } else {
        throw new Error("Failed to update game details on the server.");
      }
    } catch (error: any) {
      console.error("Error saving game changes:", error);
      toast({ title: "Save Failed", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGameMode = async () => {
    if (!game || !newGameModeId.trim() || !newGameModeName.trim()) {
      toast({ title: "Error", description: "Game Mode ID and Name are required.", variant: "destructive" });
      return;
    }
    if (game.gameModes.some(gm => gm.id === newGameModeId.trim())) {
      toast({ title: "Error", description: `Game Mode with ID "${newGameModeId.trim()}" already exists.`, variant: "destructive" });
      return;
    }
    setIsSavingGameMode(true);
    try {
      const newMode: GameMode = {
        id: newGameModeId.trim(),
        name: newGameModeName.trim(),
        description: newGameModeDescription.trim() || undefined,
        iconImageUrl: newGameModeIconUrl.trim() || undefined,
        bannerImageUrl: newGameModeBannerUrl.trim() || undefined,
      };
      const updatedGameModes = [...game.gameModes, newMode];
      const updatedGame = await updateGame(game.id, { gameModes: updatedGameModes });
      if (updatedGame) {
        setGame(updatedGame);
        toast({ title: "Game Mode Added", description: `"${newMode.name}" added successfully.` });
        setIsGameModeModalOpen(false);
        setNewGameModeId('');
        setNewGameModeName('');
        setNewGameModeDescription('');
        setNewGameModeIconUrl('');
        setNewGameModeBannerUrl('');
      } else {
        throw new Error("Failed to update game with new mode.");
      }
    } catch (error: any) {
      toast({ title: "Error Adding Mode", description: error.message || "Could not add game mode.", variant: "destructive" });
    } finally {
      setIsSavingGameMode(false);
    }
  };

  const handleOpenEditGameModeModal = (mode: GameMode) => {
    setCurrentEditingGameMode(mode);
    setEditGameModeName(mode.name);
    setEditGameModeDescription(mode.description || '');
    setEditGameModeIconUrl(mode.iconImageUrl || null);
    setEditGameModeBannerUrl(mode.bannerImageUrl || null);
    setIsEditGameModeModalOpen(true);
  };

  const handleUpdateGameMode = async () => {
    if (!game || !currentEditingGameMode || !editGameModeName.trim()) {
      toast({ title: "Error", description: "Game Mode Name is required for update.", variant: "destructive" });
      return;
    }
    setIsUpdatingGameMode(true);
    try {
      const updatedMode: GameMode = {
        ...currentEditingGameMode,
        name: editGameModeName.trim(),
        description: editGameModeDescription.trim() || undefined,
        iconImageUrl: editGameModeIconUrl || undefined,
        bannerImageUrl: editGameModeBannerUrl || undefined,
      };

      const updatedGameModes = game.gameModes.map(gm =>
        gm.id === currentEditingGameMode.id ? updatedMode : gm
      );

      const updatedGame = await updateGame(game.id, { gameModes: updatedGameModes });
      if (updatedGame) {
        setGame(updatedGame);
        toast({ title: "Game Mode Updated", description: `"${updatedMode.name}" updated successfully.` });
        setIsEditGameModeModalOpen(false);
        setCurrentEditingGameMode(null);
      } else {
        throw new Error("Failed to update game with modified mode.");
      }
    } catch (error: any) {
      toast({ title: "Error Updating Mode", description: error.message || "Could not update game mode.", variant: "destructive" });
    } finally {
      setIsUpdatingGameMode(false);
    }
  };

  const handleDeleteGameMode = async (modeIdToDelete: string) => {
    if (!game) return;

    const tournamentsUsingMode = await getTournamentsByGameId(game.id, undefined, modeIdToDelete);
    if (tournamentsUsingMode.length > 0) {
        toast({
            title: "Cannot Delete Game Mode",
            description: `This game mode is currently used by ${tournamentsUsingMode.length} tournament(s). Please reassign or delete these tournaments first.`,
            variant: "destructive",
            duration: 7000,
        });
        return;
    }

    try {
      const updatedGameModes = game.gameModes.filter(gm => gm.id !== modeIdToDelete);
      const updatedGame = await updateGame(game.id, { gameModes: updatedGameModes });
      if (updatedGame) {
        setGame(updatedGame);
        toast({ title: "Game Mode Deleted", description: `Game mode removed successfully.` });
      } else {
        throw new Error("Failed to update game after deleting mode.");
      }
    } catch (error: any) {
      toast({ title: "Error Deleting Mode", description: error.message || "Could not delete game mode.", variant: "destructive" });
    }
  };

  const handleAddDailyTournamentTemplate = async () => {
    if (!game || !newTemplateName.trim() || !newTemplateGameModeId || newTemplateEntryFee < 0 || newTemplateTotalSpots <= 0 || !newTemplateTime) {
        toast({ title: "Error", description: "All fields for daily template are required and must be valid.", variant: "destructive" });
        return;
    }
    setIsSavingDailyTemplate(true);
    try {
        const newTemplate: DailyTournamentTemplate = {
            id: `daily-tpl-${game.id}-${Date.now()}`,
            templateName: newTemplateName.trim(),
            gameModeId: newTemplateGameModeId,
            entryFee: newTemplateEntryFee,
            prizePool: newTemplatePrizePool.trim(),
            imageUrl: newTemplateImageUrl || undefined,
            totalSpots: newTemplateTotalSpots,
            tournamentTime: newTemplateTime,
            registrationCloseOffsetHours: newTemplateRegOffset,
        };
        const updatedTemplates = [...(game.dailyTournamentTemplates || []), newTemplate];
        const updatedGame = await updateGame(game.id, { dailyTournamentTemplates: updatedTemplates });
        if (updatedGame) {
            setGame(updatedGame);
            toast({ title: "Daily Template Added", description: `"${newTemplate.templateName}" added successfully.` });
            setIsDailyTemplateModalOpen(false);
            // Reset form fields
            setNewTemplateName('');
            setNewTemplateGameModeId('');
            setNewTemplateEntryFee(0);
            setNewTemplatePrizePool('');
            setNewTemplateImageUrl(null);
            setNewTemplateTotalSpots(32);
            setNewTemplateTime('18:00');
            setNewTemplateRegOffset(2);
        } else {
            throw new Error("Failed to update game with new daily template.");
        }
    } catch (error: any) {
        toast({ title: "Error Adding Template", description: error.message || "Could not add daily tournament template.", variant: "destructive" });
    } finally {
        setIsSavingDailyTemplate(false);
    }
  };
  
  const handleOpenEditDailyTemplateModal = (template: DailyTournamentTemplate) => {
    setCurrentEditingTemplate(template);
    setEditTemplateName(template.templateName);
    setEditTemplateGameModeId(template.gameModeId);
    setEditTemplateEntryFee(template.entryFee);
    setEditTemplatePrizePool(template.prizePool);
    setEditTemplateImageUrl(template.imageUrl || null);
    setEditTemplateTotalSpots(template.totalSpots);
    setEditTemplateTime(template.tournamentTime);
    setEditTemplateRegOffset(template.registrationCloseOffsetHours);
    setIsEditDailyTemplateModalOpen(true);
  };

  const handleUpdateDailyTournamentTemplate = async () => {
    if (!game || !currentEditingTemplate || !editTemplateName.trim() || !editTemplateGameModeId || editTemplateEntryFee < 0 || editTemplateTotalSpots <= 0 || !editTemplateTime) {
        toast({ title: "Error", description: "All fields for daily template are required and must be valid.", variant: "destructive" });
        return;
    }
    setIsUpdatingDailyTemplate(true);
    try {
        const updatedTemplate: DailyTournamentTemplate = {
            ...currentEditingTemplate,
            templateName: editTemplateName.trim(),
            gameModeId: editTemplateGameModeId,
            entryFee: editTemplateEntryFee,
            prizePool: editTemplatePrizePool.trim(),
            imageUrl: editTemplateImageUrl || undefined,
            totalSpots: editTemplateTotalSpots,
            tournamentTime: editTemplateTime,
            registrationCloseOffsetHours: editTemplateRegOffset,
        };

        const updatedTemplates = (game.dailyTournamentTemplates || []).map(t => 
            t.id === currentEditingTemplate.id ? updatedTemplate : t
        );
        const updatedGame = await updateGame(game.id, { dailyTournamentTemplates: updatedTemplates });

        if (updatedGame) {
            setGame(updatedGame);
            toast({ title: "Daily Template Updated", description: `"${updatedTemplate.templateName}" updated successfully.` });
            setIsEditDailyTemplateModalOpen(false);
            setCurrentEditingTemplate(null);
        } else {
            throw new Error("Failed to update game with modified daily template.");
        }
    } catch (error: any) {
        toast({ title: "Error Updating Template", description: error.message || "Could not update daily tournament template.", variant: "destructive" });
    } finally {
        setIsUpdatingDailyTemplate(false);
    }
  };

  const handleDeleteDailyTournamentTemplate = async (templateIdToDelete: string) => {
    if (!game) return;
    setIsLoading(true); // Use general loading or a specific one if preferred
    try {
        const updatedTemplates = (game.dailyTournamentTemplates || []).filter(t => t.id !== templateIdToDelete);
        const updatedGame = await updateGame(game.id, { dailyTournamentTemplates: updatedTemplates });
        if (updatedGame) {
            setGame(updatedGame);
            toast({ title: "Daily Template Deleted", description: `Daily template removed successfully.` });
        } else {
            throw new Error("Failed to update game after deleting daily template.");
        }
    } catch (error: any) {
        toast({ title: "Error Deleting Template", description: error.message || "Could not delete daily tournament template.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
        <p className="ml-4 text-muted-foreground">Loading game details...</p>
      </div>
    );
  }

  if (!game) {
    return (
        <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">Game details could not be loaded.</p>
            <Button asChild variant="link" className="mt-4">
                <Link href="/admin/games">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games List
                </Link>
            </Button>
        </div>
    );
  }

  const statItems = [
    { title: `Tournaments Hosted (in ${adminSelectedRegion})`, value: gameStats?.tournamentCount ?? 0, Icon: BarChartBig },
    { title: `Spots Filled (in ${adminSelectedRegion})`, value: `${gameStats?.totalSpotsFilled ?? 0} / ${gameStats?.totalSpotsAvailable ?? 0}`, Icon: Users },
    { title: `Total Entry Fees (in ${adminSelectedRegion})`, value: formatCurrency(gameStats?.totalEntryFeesCollected ?? 0, gameStats?.regionCurrency || 'USD') , Icon: DollarSign },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Button variant="outline" onClick={() => router.push('/admin/games')} className="transform hover:scale-105 transition-transform">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games List
      </Button>

      <header className="mb-8 relative rounded-xl overflow-hidden shadow-2xl">
         <Image
            src={previewBannerUrl || game.bannerImageUrl || `https://placehold.co/1200x300.png`}
            alt={`${game.name} banner`}
            width={1200}
            height={300}
            className="w-full h-56 object-cover"
            data-ai-hint={game.dataAiHint}
            key={previewBannerUrl ? `preview-${previewBannerUrl}` : `game-banner-${game.bannerImageUrl || game.id}`}
          />
          <div className={`absolute inset-0 ${themeGradient || game.themeGradient} opacity-60 mix-blend-multiply`}></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/30">
            <Image
              src={previewIconUrl || game.iconImageUrl || `https://placehold.co/100x100.png`}
              alt={`${game.name} icon`}
              width={80}
              height={80}
              className="h-20 w-20 rounded-lg object-contain mb-3 drop-shadow-lg border-2 border-primary-foreground/50"
              key={previewIconUrl ? `header-icon-preview-${previewIconUrl}` : `header-icon-${game.iconImageUrl || game.id}`}
            />
            <h1 className="text-4xl font-extrabold text-primary-foreground tracking-tight drop-shadow-xl">
              Manage: {game.name}
            </h1>
          </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statItems.map((item, idx) => (
            <Card
            key={item.title}
            className="shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:scale-105 bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 hover:bg-card/70 hover:backdrop-blur-md rounded-xl"
            style={{ animationDelay: `${idx * 100}ms` }}
            >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <item.Icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{item.value}</div>
            </CardContent>
            </Card>
        ))}
      </div>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Edit3 className="mr-3 h-7 w-7 text-primary" />
            Customize Game Page Content
          </CardTitle>
          <CardDescription>Modify the display details for the main {game.name} page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="gameBannerUpload" className="flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-muted-foreground"/>Game Page Banner</Label>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Image
                    src={previewBannerUrl || game.bannerImageUrl || `https://placehold.co/200x120.png`}
                    alt="Current game page banner"
                    width={200}
                    height={120}
                    className="rounded-md object-cover aspect-video border shadow-sm"
                    key={previewBannerUrl ? `thumb-preview-${previewBannerUrl}` : `thumb-game-${game.bannerImageUrl || game.id}`}
                />
                <input
                    type="file"
                    id="gameBannerUpload"
                    ref={bannerInputRef}
                    onChange={handleGameBannerFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full sm:w-auto transform hover:scale-105 transition-transform rounded-lg"
                >
                    <CloudUpload className="mr-2 h-4 w-4" /> Change Game Banner
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Recommended: 1200x300 pixels. Upload a new banner for the game's main page (max 10MB).</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gameIconUpload" className="flex items-center"><ShieldPlus className="mr-2 h-4 w-4 text-muted-foreground"/>Game Icon</Label>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Image
                    src={previewIconUrl || game.iconImageUrl || `https://placehold.co/100x100.png`}
                    alt="Current game icon"
                    width={100}
                    height={100}
                    className="rounded-md object-contain aspect-square border shadow-sm"
                    key={previewIconUrl ? `thumb-icon-preview-${previewIconUrl}` : `thumb-game-icon-${game.iconImageUrl || game.id}`}
                />
                <input
                    type="file"
                    id="gameIconUpload"
                    ref={iconInputRef}
                    onChange={handleGameIconFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => iconInputRef.current?.click()}
                    className="w-full sm:w-auto transform hover:scale-105 transition-transform rounded-lg"
                >
                    <CloudUpload className="mr-2 h-4 w-4" /> Change Game Icon
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Upload game icon (recommended 1:1 aspect ratio, e.g., 100x100 pixels, max 1MB).</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground"/>Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter game description..." rows={4}/>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="themeGradient" className="flex items-center"><Palette className="mr-2 h-4 w-4 text-muted-foreground"/>Theme Gradient CSS Class</Label>
                <Input id="themeGradient" value={themeGradient} onChange={(e) => setThemeGradient(e.target.value)} placeholder="e.g., from-blue-500 to-purple-600"/>
                <p className="text-xs text-muted-foreground">Enter Tailwind CSS gradient classes for game page banner overlay.</p>
            </div>
           </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Manage Game Modes Card */}
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <Puzzle className="mr-3 h-7 w-7 text-primary" />
              Manage Game Modes
            </CardTitle>
            <CardDescription>Define different modes of play for {game.name}.</CardDescription>
          </div>
          <Dialog open={isGameModeModalOpen} onOpenChange={setIsGameModeModalOpen}>
            <DialogModalTrigger asChild>
              <Button variant="outline" className="transform hover:scale-105 transition-transform">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Game Mode
              </Button>
            </DialogModalTrigger>
            <DialogModalContent className="sm:max-w-lg bg-card/90 backdrop-blur-xl">
              <DialogModalHeader>
                <DialogModalTitle className="text-xl">Add New Game Mode for {game.name}</DialogModalTitle>
                <DialogModalDescription>
                  Define a new mode of play. The ID should be a unique slug.
                </DialogModalDescription>
              </DialogModalHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newGameModeId" className="text-right">ID (Slug)</Label>
                  <Input id="newGameModeId" value={newGameModeId} onChange={(e) => setNewGameModeId(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} className="col-span-3" placeholder="e.g., solo-brawls" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newGameModeName" className="text-right">Name</Label>
                  <Input id="newGameModeName" value={newGameModeName} onChange={(e) => setNewGameModeName(e.target.value)} className="col-span-3" placeholder="e.g., Solo Brawls" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newGameModeDescription" className="text-right">Description</Label>
                  <Textarea id="newGameModeDescription" value={newGameModeDescription} onChange={(e) => setNewGameModeDescription(e.target.value)} className="col-span-3" placeholder="Brief description of the mode (optional)" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gameModeIconUpload" className="text-right">Icon (Opt.)</Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <input
                        type="file"
                        id="gameModeIconUpload"
                        ref={gameModeIconInputRef}
                        onChange={(e) => handleFileSelection(e, (uri) => setNewGameModeIconUrl(uri || ''), {maxSizeMB: 1, toastTitle: "Game Mode Icon Preview"}) }
                        accept="image/*"
                        style={{ display: 'none' }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => gameModeIconInputRef.current?.click()}>
                            <CloudUpload className="mr-2 h-4 w-4"/> Upload
                        </Button>
                        {newGameModeIconUrl && <Image src={newGameModeIconUrl} alt="Icon preview" width={32} height={32} className="rounded border object-contain" />}
                    </div>
                </div>
                <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Recommended: 1:1 ratio (e.g. 100x100px). Max 1MB.</p>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gameModeBannerUpload" className="text-right">Banner (Opt.)</Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <input
                        type="file"
                        id="gameModeBannerUpload"
                        ref={gameModeBannerInputRef}
                        onChange={(e) => handleFileSelection(e, (uri) => setNewGameModeBannerUrl(uri || ''), {maxSizeMB: 2, toastTitle: "Game Mode Banner Preview"}) }
                        accept="image/*"
                        style={{ display: 'none' }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => gameModeBannerInputRef.current?.click()}>
                            <ImagePlus className="mr-2 h-4 w-4"/> Upload
                        </Button>
                        {newGameModeBannerUrl && <Image src={newGameModeBannerUrl} alt="Banner preview" width={64} height={36} className="rounded border aspect-video object-cover" />}
                    </div>
                </div>
                <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Recommended: 16:9 ratio (e.g. 300x169px). Max 2MB.</p>
              </div>
              <DialogModalFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleAddGameMode} disabled={isSavingGameMode}>
                  {isSavingGameMode && <Spinner size="small" className="mr-2" />}
                  Add Mode
                </Button>
              </DialogModalFooter>
            </DialogModalContent>
          </Dialog>
        </CardHeader>
        <CardContent className="pt-6">
          {game.gameModes.length > 0 ? (
            <div className="space-y-4">
              {game.gameModes.map(mode => (
                <Card key={mode.id} className="bg-muted/30 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {mode.bannerImageUrl && (
                        <Image src={mode.bannerImageUrl} alt={`${mode.name} banner`} width={100} height={56} className="rounded-md object-cover aspect-video flex-shrink-0 border"/>
                    )}
                     {!mode.bannerImageUrl && mode.iconImageUrl && (
                        <Image src={mode.iconImageUrl} alt={`${mode.name} icon`} width={56} height={56} className="rounded-md object-contain aspect-square flex-shrink-0 border"/>
                     )}
                     {!mode.bannerImageUrl && !mode.iconImageUrl && <Puzzle className="h-14 w-14 text-muted-foreground mt-1 flex-shrink-0"/>}

                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{mode.name}</h4>
                      <p className="text-sm text-muted-foreground">ID: <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded">{mode.id}</code></p>
                      {mode.description && <p className="text-xs text-muted-foreground/80 mt-1 truncate">{mode.description}</p>}
                    </div>
                    <div className="flex-shrink-0 space-x-2 self-center sm:self-start">
                        <Button variant="outline" size="icon" onClick={() => handleOpenEditGameModeModal(mode)} className="h-8 w-8 transform hover:scale-110">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Game Mode</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8 transform hover:scale-110">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Game Mode</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>Delete Game Mode?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the game mode "{mode.name}"? This action cannot be undone.
                                If tournaments are currently using this mode, you may need to reassign them.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteGameMode(mode.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No game modes defined for {game.name} yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Game Mode Dialog */}
      <Dialog open={isEditGameModeModalOpen} onOpenChange={setIsEditGameModeModalOpen}>
        <DialogModalContent className="sm:max-w-lg bg-card/90 backdrop-blur-xl">
          <DialogModalHeader>
            <DialogModalTitle className="text-xl">Edit Game Mode: {currentEditingGameMode?.name}</DialogModalTitle>
            <DialogModalDescription>
              Update the details for this game mode. The ID cannot be changed.
            </DialogModalDescription>
          </DialogModalHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editGameModeName" className="text-right">Name</Label>
              <Input id="editGameModeName" value={editGameModeName} onChange={(e) => setEditGameModeName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editGameModeDescription" className="text-right">Description</Label>
              <Textarea id="editGameModeDescription" value={editGameModeDescription} onChange={(e) => setEditGameModeDescription(e.target.value)} className="col-span-3" placeholder="Brief description (optional)" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editGameModeIconUpload" className="text-right">Icon (Opt.)</Label>
                <div className="col-span-3 flex items-center gap-2">
                    <input
                    type="file"
                    id="editGameModeIconUpload"
                    ref={editGameModeIconInputRef}
                    onChange={(e) => handleFileSelection(e, setEditGameModeIconUrl, {maxSizeMB: 1, toastTitle: "Game Mode Icon Preview Updated"}) }
                    accept="image/*"
                    style={{ display: 'none' }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => editGameModeIconInputRef.current?.click()}>
                        <CloudUpload className="mr-2 h-4 w-4"/> Change Icon
                    </Button>
                    {editGameModeIconUrl && <Image src={editGameModeIconUrl} alt="Icon preview" width={32} height={32} className="rounded border object-contain" />}
                    {!editGameModeIconUrl && currentEditingGameMode?.iconImageUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditGameModeIconUrl(null)} title="Remove current icon">
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                    )}
                </div>
            </div>
            <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Recommended: 1:1 ratio (e.g. 100x100px). Max 1MB.</p>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editGameModeBannerUpload" className="text-right">Banner (Opt.)</Label>
                <div className="col-span-3 flex items-center gap-2">
                    <input
                    type="file"
                    id="editGameModeBannerUpload"
                    ref={editGameModeBannerInputRef}
                    onChange={(e) => handleFileSelection(e, setEditGameModeBannerUrl, {maxSizeMB: 2, toastTitle: "Game Mode Banner Preview Updated"}) }
                    accept="image/*"
                    style={{ display: 'none' }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => editGameModeBannerInputRef.current?.click()}>
                        <ImagePlus className="mr-2 h-4 w-4"/> Change Banner
                    </Button>
                    {editGameModeBannerUrl && <Image src={editGameModeBannerUrl} alt="Banner preview" width={64} height={36} className="rounded border aspect-video object-cover" />}
                     {!editGameModeBannerUrl && currentEditingGameMode?.bannerImageUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditGameModeBannerUrl(null)} title="Remove current banner">
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                    )}
                </div>
            </div>
            <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Recommended: 16:9 ratio (e.g. 300x169px). Max 2MB.</p>
          </div>
          <DialogModalFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleUpdateGameMode} disabled={isUpdatingGameMode}>
              {isUpdatingGameMode && <Spinner size="small" className="mr-2" />}
              Save Changes
            </Button>
          </DialogModalFooter>
        </DialogModalContent>
      </Dialog>

      <Separator />
       {/* Manage Daily Tournament Templates Card */}
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <CalendarPlus className="mr-3 h-7 w-7 text-primary" />
              Manage Daily Tournament Templates
            </CardTitle>
            <CardDescription>Define reusable templates for daily recurring tournaments for {game.name}.</CardDescription>
          </div>
          <Dialog open={isDailyTemplateModalOpen} onOpenChange={setIsDailyTemplateModalOpen}>
            <DialogModalTrigger asChild>
              <Button variant="outline" className="transform hover:scale-105 transition-transform">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Template
              </Button>
            </DialogModalTrigger>
            <DialogModalContent className="sm:max-w-lg bg-card/90 backdrop-blur-xl">
              <DialogModalHeader>
                <DialogModalTitle className="text-xl">Add New Daily Tournament Template</DialogModalTitle>
                <DialogModalDescription>Configure a template for daily tournaments.</DialogModalDescription>
              </DialogModalHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTemplateName" className="text-right">Template Name</Label>
                  <Input id="newTemplateName" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="col-span-3" placeholder="e.g., Morning CS 1v1" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newTemplateGameModeId" className="text-right">Game Mode</Label>
                    <Select
                        value={newTemplateGameModeId}
                        onValueChange={setNewTemplateGameModeId}
                    >
                        <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select game mode" />
                        </SelectTrigger>
                        <SelectContent>
                        {game.gameModes.map(mode => (
                            <SelectItem key={mode.id} value={mode.id}>{mode.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTemplateEntryFee" className="text-right">Entry Fee</Label>
                  <Input id="newTemplateEntryFee" type="number" value={newTemplateEntryFee} onChange={(e) => setNewTemplateEntryFee(parseFloat(e.target.value))} className="col-span-3" placeholder="e.g., 10" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTemplatePrizePool" className="text-right">Prize Pool</Label>
                  <Textarea id="newTemplatePrizePool" value={newTemplatePrizePool} onChange={(e) => setNewTemplatePrizePool(e.target.value)} className="col-span-3" placeholder="e.g., 100 Credits, In-game items" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dailyTemplateBannerUpload" className="text-right">Banner (Opt.)</Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <input
                        type="file"
                        id="dailyTemplateBannerUpload"
                        ref={dailyTemplateBannerInputRef}
                        onChange={(e) => handleFileSelection(e, setNewTemplateImageUrl, {maxSizeMB: 2, toastTitle: "Daily Template Banner Preview"}) }
                        accept="image/*"
                        style={{ display: 'none' }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => dailyTemplateBannerInputRef.current?.click()}>
                            <ImagePlus className="mr-2 h-4 w-4"/> Upload
                        </Button>
                        {newTemplateImageUrl && <Image src={newTemplateImageUrl} alt="Banner preview" width={64} height={36} className="rounded border aspect-video object-cover" />}
                    </div>
                </div>
                <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Recommended: 16:9 ratio. Max 2MB.</p>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTemplateTotalSpots" className="text-right">Total Spots</Label>
                  <Input id="newTemplateTotalSpots" type="number" value={newTemplateTotalSpots} onChange={(e) => setNewTemplateTotalSpots(parseInt(e.target.value, 10))} className="col-span-3" placeholder="e.g., 64" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTemplateTime" className="text-right">Tournament Time</Label>
                  <Input id="newTemplateTime" type="time" value={newTemplateTime} onChange={(e) => setNewTemplateTime(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newTemplateRegOffset" className="text-right">Reg. Close (Hours Before)</Label>
                  <Input id="newTemplateRegOffset" type="number" value={newTemplateRegOffset} onChange={(e) => setNewTemplateRegOffset(parseInt(e.target.value, 10))} className="col-span-3" placeholder="e.g., 2" />
                </div>
              </div>
              <DialogModalFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleAddDailyTournamentTemplate} disabled={isSavingDailyTemplate}>
                  {isSavingDailyTemplate && <Spinner size="small" className="mr-2" />}
                  Add Template
                </Button>
              </DialogModalFooter>
            </DialogModalContent>
          </Dialog>
        </CardHeader>
        <CardContent className="pt-6">
          {(game.dailyTournamentTemplates || []).length > 0 ? (
            <div className="space-y-4">
              {(game.dailyTournamentTemplates || []).map(template => (
                <Card key={template.id} className="bg-muted/30 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {template.imageUrl && (
                        <Image src={template.imageUrl} alt={`${template.templateName} banner`} width={100} height={56} className="rounded-md object-cover aspect-video flex-shrink-0 border"/>
                    )}
                    {!template.imageUrl && <CalendarPlus className="h-14 w-14 text-muted-foreground mt-1 flex-shrink-0"/>}
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{template.templateName}</h4>
                      <p className="text-sm text-muted-foreground">Mode: {game.gameModes.find(gm => gm.id === template.gameModeId)?.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1 truncate">
                        Time: {template.tournamentTime} | Spots: {template.totalSpots} | Fee: {template.entryFee} | Reg. Close: {template.registrationCloseOffsetHours}h before
                      </p>
                    </div>
                    <div className="flex-shrink-0 space-x-2 self-center sm:self-start">
                        <Button variant="outline" size="icon" className="h-8 w-8 transform hover:scale-110" onClick={() => handleOpenEditDailyTemplateModal(template)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Template</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8 transform hover:scale-110">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Template</span>
                            </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>Delete Daily Template?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the template "{template.templateName}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDailyTournamentTemplate(template.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No daily tournament templates defined for {game.name} yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Daily Tournament Template Dialog */}
      <Dialog open={isEditDailyTemplateModalOpen} onOpenChange={setIsEditDailyTemplateModalOpen}>
        <DialogModalContent className="sm:max-w-lg bg-card/90 backdrop-blur-xl">
          <DialogModalHeader>
            <DialogModalTitle className="text-xl">Edit Daily Template: {currentEditingTemplate?.templateName}</DialogModalTitle>
            <DialogModalDescription>Update the details for this daily tournament template.</DialogModalDescription>
          </DialogModalHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTemplateName" className="text-right">Template Name</Label>
              <Input id="editTemplateName" value={editTemplateName} onChange={(e) => setEditTemplateName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editTemplateGameModeId" className="text-right">Game Mode</Label>
                <Select value={editTemplateGameModeId} onValueChange={setEditTemplateGameModeId}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select game mode" />
                    </SelectTrigger>
                    <SelectContent>
                        {game.gameModes.map(mode => (<SelectItem key={mode.id} value={mode.id}>{mode.name}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editTemplateEntryFee" className="text-right">Entry Fee</Label>
                <Input id="editTemplateEntryFee" type="number" value={editTemplateEntryFee} onChange={(e) => setEditTemplateEntryFee(parseFloat(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editTemplatePrizePool" className="text-right">Prize Pool</Label>
                <Textarea id="editTemplatePrizePool" value={editTemplatePrizePool} onChange={(e) => setEditTemplatePrizePool(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDailyTemplateBannerUpload" className="text-right">Banner (Opt.)</Label>
                <div className="col-span-3 flex items-center gap-2">
                    <input type="file" id="editDailyTemplateBannerUpload" ref={editDailyTemplateBannerInputRef} onChange={(e) => handleFileSelection(e, setEditTemplateImageUrl, {maxSizeMB: 2, toastTitle: "Template Banner Preview Updated"})} accept="image/*" style={{ display: 'none' }}/>
                    <Button type="button" variant="outline" size="sm" onClick={() => editDailyTemplateBannerInputRef.current?.click()}><ImagePlus className="mr-2 h-4 w-4"/> Change Banner</Button>
                    {editTemplateImageUrl && <Image src={editTemplateImageUrl} alt="Banner preview" width={64} height={36} className="rounded border aspect-video object-cover" />}
                    {!editTemplateImageUrl && currentEditingTemplate?.imageUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditTemplateImageUrl(null)} title="Remove current banner"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    )}
                </div>
            </div>
             <p className="col-span-4 text-xs text-muted-foreground text-center -mt-2">Recommended: 16:9 ratio. Max 2MB.</p>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editTemplateTotalSpots" className="text-right">Total Spots</Label>
                <Input id="editTemplateTotalSpots" type="number" value={editTemplateTotalSpots} onChange={(e) => setEditTemplateTotalSpots(parseInt(e.target.value, 10))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editTemplateTime" className="text-right">Tournament Time</Label>
                <Input id="editTemplateTime" type="time" value={editTemplateTime} onChange={(e) => setEditTemplateTime(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editTemplateRegOffset" className="text-right">Reg. Close (Hours Before)</Label>
                <Input id="editTemplateRegOffset" type="number" value={editTemplateRegOffset} onChange={(e) => setEditTemplateRegOffset(parseInt(e.target.value, 10))} className="col-span-3" />
            </div>
          </div>
          <DialogModalFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="button" onClick={handleUpdateDailyTournamentTemplate} disabled={isUpdatingDailyTemplate}>
              {isUpdatingDailyTemplate && <Spinner size="small" className="mr-2" />} Save Changes
            </Button>
          </DialogModalFooter>
        </DialogModalContent>
      </Dialog>


      <Separator />

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Layers className="mr-3 h-7 w-7 text-primary" />
            Manage Frequent Tournament Banners
          </CardTitle>
          <CardDescription>Upload and manage common banners for {game.name} tournaments. These can be selected when creating new tournaments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
           <div className="space-y-2">
            <Label htmlFor="frequentBannerUpload" className="flex items-center"><CloudUpload className="mr-2 h-4 w-4 text-muted-foreground"/>Add New Frequent Banner</Label>
             <input
                  type="file"
                  id="frequentBannerUpload"
                  ref={frequentBannerInputRef}
                  onChange={handleFrequentBannerFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
              />
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => frequentBannerInputRef.current?.click()}
                  className="w-full sm:w-auto transform hover:scale-105 transition-transform rounded-lg"
              >
                  <CloudUpload className="mr-2 h-4 w-4" /> Upload Banner
              </Button>
            <p className="text-xs text-muted-foreground">Recommended: 16:9 aspect ratio (e.g., 1280x720 pixels). Upload common banners (max 2MB each). These will be available when creating tournaments for this game.</p>
          </div>

          {frequentBanners.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-2 text-foreground">Current Frequent Banners:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {frequentBanners.map((bannerUri, index) => (
                  <div key={index} className="relative group aspect-video">
                    <Image
                      src={bannerUri}
                      alt={`Frequent Banner ${index + 1}`}
                      fill
                      style={{objectFit:"cover"}}
                      className="rounded-md border shadow-sm"
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity bg-destructive/70 hover:bg-destructive/90 backdrop-blur-sm rounded-full"
                          aria-label="Delete frequent banner"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Frequent Banner?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Are you sure you want to remove this banner from the frequent list?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFrequentBanner(index)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CardFooter className="mt-8 py-6 border-t bg-card/50 backdrop-blur-sm rounded-b-xl">
        <div className="flex justify-end w-full">
            <Button onClick={handleSaveChanges} disabled={isSaving} className="min-w-[150px] transform hover:scale-105 transition-transform rounded-lg">
            {isSaving ? <Spinner size="small" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving Details...' : 'Save Content & Banners'}
            </Button>
        </div>
      </CardFooter>
    </div>
  );
}
