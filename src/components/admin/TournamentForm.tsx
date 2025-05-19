// src/components/admin/TournamentForm.tsx
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Matcher } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getGameById, type Game } from '@/data/games';
import type { Tournament } from '@/data/tournaments';
import { useAdminContext } from '@/context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Save, XCircle, AlertCircle, UploadCloud, CheckCircle, ImageOff, Puzzle, SparklesIcon, CalendarDays, Settings, Info, DollarSign, Users, Crown, Images } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';


const tournamentFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  gameId: z.string().min(1, 'Please select a game'),
  gameModeId: z.string().min(1, 'Please select a game mode').refine(val => val !== 'default', { message: "Please select a valid game mode."}),
  isSpecial: z.boolean().default(false),
  tournamentDate: z.date({ required_error: "Tournament date is required." }),
  registrationCloseDate: z.date({ required_error: "Registration close date is required." }),
  entryFee: z.preprocess(
    (val) => String(val).trim() === '' ? undefined : Number(String(val)),
    z.number().min(0, 'Entry fee cannot be negative')
  ),
  entryFeeCurrency: z.enum(['USD', 'INR']),
  region: z.enum(['USA', 'INDIA']),
  prizePool: z.string().min(1, 'Prize pool description is required'),
  imageUrl: z.string().optional(),
  totalSpots: z.preprocess(
    (val) => Number(String(val)),
    z.number().int().min(1, 'Total spots must be at least 1')
  ),
}).refine(data => data.registrationCloseDate < data.tournamentDate, {
  message: "Registration close date must be before the tournament date.",
  path: ["registrationCloseDate"],
});

export type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

interface TournamentFormProps {
  onSubmit: (data: TournamentFormValues) => Promise<void> | void;
  initialData?: Tournament | null;
  games: Game[];
  onCancel: () => void;
}

export function TournamentForm({ onSubmit, initialData, games, onCancel }: TournamentFormProps) {
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();
  const [selectedGameDetails, setSelectedGameDetails] = useState<Game | null>(null);
  const [isLoadingGameDetails, setIsLoadingGameDetails] = useState(false);
  const [customBannerPreview, setCustomBannerPreview] = useState<string | null>(null);
  const customBannerInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialData;

  const defaultEntryFeeCurrency = adminSelectedRegion === 'INDIA' ? 'INR' : 'USD';
  const defaultRegion = adminSelectedRegion;


  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue, watch, getValues } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    // Default values are set in the useEffect hook below for better control
  });

  const watchedGameId = watch('gameId');
  const watchedImageUrl = watch('imageUrl');
  const currentEntryFeeCurrency = watch('entryFeeCurrency');
  const watchedTournamentDate = watch('tournamentDate');
  const watchedRegistrationCloseDate = watch('registrationCloseDate');

  // Effect for initial form population (on mount or when initialData/games change)
  useEffect(() => {
    const initializeForm = async () => {
      setIsLoadingGameDetails(true);
      const gameToLoadId = isEditMode ? initialData?.gameId : (games.length > 0 ? games[0].id : '');
      let gameDataForInit: Game | null = null;

      if (gameToLoadId) {
        try {
          gameDataForInit = await getGameById(gameToLoadId);
          setSelectedGameDetails(gameDataForInit);
        } catch (error) {
          toast({ title: "Error", description: "Could not load initial game details.", variant: "destructive" });
          setSelectedGameDetails(null);
        }
      } else {
        setSelectedGameDetails(null);
      }

      const defaultGameModeId = gameDataForInit?.gameModes?.[0]?.id || 'default';
      const defaultImageUrl = gameDataForInit?.frequentlyUsedBanners?.[0] || gameDataForInit?.bannerImageUrl || gameDataForInit?.imageUrl || '';

      if (isEditMode && initialData) {
        reset({
          ...initialData,
          tournamentDate: initialData.tournamentDate ? new Date(initialData.tournamentDate) : undefined,
          registrationCloseDate: initialData.registrationCloseDate ? new Date(initialData.registrationCloseDate) : undefined,
          gameModeId: initialData.gameModeId || defaultGameModeId,
          imageUrl: initialData.imageUrl || defaultImageUrl,
          entryFeeCurrency: initialData.entryFeeCurrency || defaultEntryFeeCurrency,
          region: initialData.region || defaultRegion,
          isSpecial: initialData.isSpecial || false,
        });
        if (initialData.imageUrl && initialData.imageUrl.startsWith('data:image/')) {
          setCustomBannerPreview(initialData.imageUrl);
        } else {
          setCustomBannerPreview(null);
        }
      } else {
        reset({
          name: '',
          gameId: gameToLoadId,
          gameModeId: defaultGameModeId,
          isSpecial: false,
          tournamentDate: undefined,
          registrationCloseDate: undefined,
          entryFee: 0,
          entryFeeCurrency: defaultEntryFeeCurrency,
          region: defaultRegion,
          prizePool: '',
          imageUrl: defaultImageUrl,
          totalSpots: 32,
        });
        setCustomBannerPreview(null);
      }
      setIsLoadingGameDetails(false);
    };
    initializeForm();
  }, [isEditMode, initialData, games, reset, toast, defaultEntryFeeCurrency, defaultRegion]);


  // Effect to fetch and update game details when watchedGameId changes
  useEffect(() => {
    const fetchGameDetails = async () => {
      if (watchedGameId) {
        // Avoid refetching if it's the initial game in edit mode and details are already loaded
        if (isEditMode && initialData?.gameId === watchedGameId && selectedGameDetails?.id === watchedGameId) {
          return;
        }
        // Avoid refetching if details for the current watchedGameId are already loaded
        if (selectedGameDetails?.id === watchedGameId) {
           // If details are already loaded for this game, ensure form fields are synced, especially gameModeId
            const currentSelectedGameFirstMode = selectedGameDetails.gameModes?.[0]?.id || 'default';
            if (getValues('gameModeId') !== currentSelectedGameFirstMode && (selectedGameDetails.gameModes || []).length > 0) {
                 // This might happen if the form was reset to a different game's mode
                setValue('gameModeId', currentSelectedGameFirstMode, { shouldValidate: true, shouldDirty: true });
            }
            return;
        }


        setIsLoadingGameDetails(true);
        try {
          const gameData = await getGameById(watchedGameId);
          setSelectedGameDetails(gameData); // This triggers the next useEffect
        } catch (error) {
          console.error("Failed to fetch game details:", error);
          setSelectedGameDetails(null);
          toast({ title: "Error", description: "Could not load details for the selected game.", variant: "destructive" });
        } finally {
          setIsLoadingGameDetails(false);
        }
      } else {
        setSelectedGameDetails(null); // No game selected, clear details
      }
    };
    fetchGameDetails();
  }, [watchedGameId, isEditMode, initialData?.gameId, toast, selectedGameDetails, getValues, setValue]);


  // Effect to update form fields when selectedGameDetails (and thus game modes) change
  useEffect(() => {
    if (selectedGameDetails) {
      const newGameModeId = selectedGameDetails.gameModes?.[0]?.id || 'default';
      // Only set if the current gameModeId is not valid for the new set of modes
      // or if the form's gameId truly matches the selectedGameDetails.id (to avoid stale updates)
      if (getValues('gameId') === selectedGameDetails.id) {
        const currentModeId = getValues('gameModeId');
        const modeExists = selectedGameDetails.gameModes?.some(mode => mode.id === currentModeId);
        if (!modeExists || currentModeId === 'default') {
            setValue('gameModeId', newGameModeId, { shouldValidate: true, shouldDirty: true });
        }
      }


      const currentImageUrl = getValues('imageUrl');
      const isCustomBanner = (currentImageUrl || '').startsWith('data:image/');
      
      // Only update banner if it's not a custom uploaded one OR if the gameId just changed
      // and the current banner is not custom (meaning it was from a previous game's frequent list).
      const previousGameId = getValues('gameId'); // This needs to be compared more carefully
                                               // For now, we assume if gameId changes, and not custom, update banner.
                                               // This might overwrite if the previous game's banner was intentionally chosen.

      if (!isCustomBanner) {
         setValue('imageUrl', selectedGameDetails.frequentlyUsedBanners?.[0] || selectedGameDetails.bannerImageUrl || selectedGameDetails.imageUrl || '', { shouldValidate: true });
         setCustomBannerPreview(null);
      } else if (watchedGameId !== getValues('gameId') && isCustomBanner) {
        // If game changed AND user had a custom banner, maybe we SHOULD clear it? Or let them keep it?
        // Current logic: keeps custom banner across game changes.
        // To clear custom banner when game changes:
        // setValue('imageUrl', selectedGameDetails.frequentlyUsedBanners?.[0] || selectedGameDetails.bannerImageUrl || selectedGameDetails.imageUrl || '', { shouldValidate: true });
        // setCustomBannerPreview(null);
      }


    } else {
      // No game selected or details failed to load
      setValue('gameModeId', 'default', { shouldValidate: true, shouldDirty: true });
      if (!getValues('imageUrl')?.startsWith('data:image/')) { // Don't clear custom banner if no game selected
        setValue('imageUrl', '', { shouldValidate: true });
        setCustomBannerPreview(null);
      }
    }
  }, [selectedGameDetails, setValue, getValues, watchedGameId]);


  useEffect(() => {
    if (watchedTournamentDate && watchedRegistrationCloseDate) {
      const tournamentDayStart = new Date(new Date(watchedTournamentDate).setHours(0, 0, 0, 0));
      const regCloseDayStart = new Date(new Date(watchedRegistrationCloseDate).setHours(0, 0, 0, 0));
      if (regCloseDayStart >= tournamentDayStart) {
        setValue('registrationCloseDate', undefined, { shouldValidate: true });
        toast({
          title: "Date Adjusted",
          description: "Registration close date was automatically cleared as it must be before the tournament date.",
          variant: "default",
          duration: 5000,
        });
      }
    }
  }, [watchedTournamentDate, watchedRegistrationCloseDate, setValue, toast]);


  const todayStart = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);
  const tournamentDateDisabledMatchers: Matcher[] = useMemo(() => [{ before: todayStart }], [todayStart]);
  const registrationCloseDateDisabledMatchers: Matcher[] = useMemo(() => {
    const matchers: Matcher[] = [{ before: todayStart }];
    if (watchedTournamentDate) {
      const tournamentDayStart = new Date(new Date(watchedTournamentDate).setHours(0,0,0,0));
      matchers.push({ from: tournamentDayStart });
    }
    return matchers;
  }, [todayStart, watchedTournamentDate]);

  const handleCustomBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File Type', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ title: 'File Too Large', description: 'Please select an image smaller than 5MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      setValue('imageUrl', dataUri, { shouldValidate: true });
      setCustomBannerPreview(dataUri);
      toast({ title: 'Custom Banner Selected', description: 'Preview updated. Save changes to apply.' });
    };
    reader.onerror = () => {
      toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    };
    reader.readAsDataURL(file);
    if(event.target) event.target.value = '';
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
      <input type="hidden" {...register('region')} value={adminSelectedRegion}/>
      <input type="hidden" {...register('entryFeeCurrency')} value={adminSelectedRegion === 'INDIA' ? 'INR' : 'USD'} />

      <Card className="bg-card/80 backdrop-blur-sm shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Core Details</CardTitle>
          <CardDescription>Basic information about the tournament for the <span className="font-semibold">{getValues('region')}</span> region.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tournament Name</Label>
            <Input id="name" {...register('name')} className={errors.name ? 'border-destructive' : ''} placeholder="e.g., Summer Skirmish Series" />
            {errors.name && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.name.message}</p>}
          </div>

          <div className="space-y-4"> {/* Changed from grid to space-y for vertical stacking */}
            <div className="space-y-1.5">
              <Label htmlFor="gameId">Game</Label>
              <Controller
                name="gameId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // watchedGameId useEffect will handle dependent field updates
                    }}
                    value={field.value}
                    disabled={isEditMode || games.length === 0}
                  >
                    <SelectTrigger className={errors.gameId ? 'border-destructive' : ''}>
                      <SelectValue placeholder={games.length > 0 ? "Select a game" : "No games available"} />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map((game) => (
                        <SelectItem key={game.id} value={game.id}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {isEditMode && <p className="text-xs text-muted-foreground mt-1">Game cannot be changed after creation.</p>}
              {games.length === 0 && <p className="text-xs text-destructive mt-1">No games found. Please create a game first.</p>}
              {errors.gameId && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.gameId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gameModeId" className="flex items-center"><Puzzle className="mr-2 h-4 w-4 text-muted-foreground"/>Game Mode</Label>
              <Controller
                key={selectedGameDetails?.id || 'no-game-selected-for-mode'} // Re-mount when actual game details change
                name="gameModeId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!watchedGameId || isLoadingGameDetails || !selectedGameDetails || (selectedGameDetails.gameModes || []).length === 0}
                  >
                    <SelectTrigger className={errors.gameModeId ? 'border-destructive' : ''}>
                      <SelectValue placeholder={
                        !watchedGameId ? "Select a game first" :
                        isLoadingGameDetails ? "Loading modes..." :
                        !selectedGameDetails || (selectedGameDetails.gameModes || []).length === 0 ? "No modes for this game" :
                        "Select a game mode"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedGameDetails?.gameModes || []).map((mode) => (
                        <SelectItem key={mode.id} value={mode.id}>
                          {mode.name}
                        </SelectItem>
                      ))}
                       {(selectedGameDetails && (selectedGameDetails.gameModes || []).length === 0) && !isLoadingGameDetails && (
                            <SelectItem value="default" disabled>No modes available</SelectItem>
                       )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gameModeId && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.gameModeId.message}</p>}
              {selectedGameDetails && (selectedGameDetails.gameModes || []).length === 0 && !isLoadingGameDetails && <p className="text-xs text-muted-foreground mt-1">No game modes defined for {selectedGameDetails.name}. Add them in Game Management.</p>}
            </div>
          </div>
           <div className="flex items-center space-x-3 pt-2">
                <Controller
                  name="isSpecial"
                  control={control}
                  render={({ field }) => (
                     <Switch
                        id="isSpecial"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Mark as special tournament"
                      />
                  )}
                />
                <Label htmlFor="isSpecial" className="flex items-center cursor-pointer">
                    <SparklesIcon className="mr-2 h-4 w-4 text-amber-400"/> Mark as Special Tournament
                </Label>
            </div>
            {errors.isSpecial && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.isSpecial.message}</p>}
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary"/>Dates & Logistics</CardTitle>
          <CardDescription>Schedule, entry fees, and participation limits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tournamentDate">Tournament Date & Time</Label>
              <Controller
                name="tournamentDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select tournament date"
                    className={errors.tournamentDate ? 'border-destructive' : ''}
                    disabledDates={tournamentDateDisabledMatchers}
                  />
                )}
              />
              {errors.tournamentDate && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.tournamentDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registrationCloseDate">Registration Close Date</Label>
              <Controller
                name="registrationCloseDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select registration close date"
                    className={errors.registrationCloseDate ? 'border-destructive' : ''}
                    disabledDates={registrationCloseDateDisabledMatchers}
                    isPickerButtonDisabled={!watchedTournamentDate}
                  />
                )}
              />
              {!watchedTournamentDate && <p className="text-xs text-muted-foreground mt-1">Select a tournament date first.</p>}
              {errors.registrationCloseDate && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.registrationCloseDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="entryFee" className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground"/>Entry Fee ({currentEntryFeeCurrency})</Label>
              <Input id="entryFee" type="number" {...register('entryFee')} className={errors.entryFee ? 'border-destructive' : ''} placeholder="0.00" step="0.01" />
              {errors.entryFee && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.entryFee.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalSpots" className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground"/>Total Spots</Label>
              <Input id="totalSpots" type="number" {...register('totalSpots')} className={errors.totalSpots ? 'border-destructive' : ''} placeholder="e.g., 64" />
              {errors.totalSpots && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.totalSpots.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Crown className="mr-2 h-5 w-5 text-primary"/>Prizing & Presentation</CardTitle>
          <CardDescription>Details about rewards and visual appearance for the tournament card.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prizePool">Prize Pool</Label>
            <Textarea id="prizePool" {...register('prizePool')} placeholder="Describe the prizes (e.g., 1000 INR, In-game items)" className={errors.prizePool ? 'border-destructive' : ''} rows={3}/>
            {errors.prizePool && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.prizePool.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center"><Images className="mr-2 h-4 w-4 text-muted-foreground"/>Tournament Banner</Label>
              <p className="text-xs text-muted-foreground">Select a frequently used banner for this game or upload a custom one.</p>
            </div>

            {isLoadingGameDetails && (!selectedGameDetails || selectedGameDetails.id !== watchedGameId) ? (
              <div className="flex items-center mt-2">
                <Spinner size="small" className="mr-2"/>
                <p className="text-sm text-muted-foreground">Loading frequent banners...</p>
              </div>
            ) : selectedGameDetails && (selectedGameDetails.frequentlyUsedBanners?.length || 0) > 0 ? (
              <>
                <p className="text-sm font-medium text-muted-foreground">Frequent Banners for {selectedGameDetails.name}:</p>
                 <ScrollArea className="h-48 w-full rounded-md border bg-muted/20 p-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedGameDetails.frequentlyUsedBanners.map((bannerUrl, index) => (
                        <button
                        type="button"
                        key={index}
                        onClick={() => {
                            setValue('imageUrl', bannerUrl, {shouldValidate: true});
                            setCustomBannerPreview(null); 
                        }}
                        className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all duration-200 hover:opacity-80 focus:outline-none
                            ${watchedImageUrl === bannerUrl && !customBannerPreview ? 'border-primary ring-2 ring-primary ring-offset-2 shadow-lg scale-105' : 'border-transparent hover:border-primary/50'}`}
                        aria-label={`Select banner ${index + 1}`}
                        >
                        <Image src={bannerUrl} alt={`Frequent Banner ${index + 1} for ${selectedGameDetails.name}`} fill style={{objectFit:"cover"}} className="transition-transform duration-200 group-hover:scale-110"/>
                        {watchedImageUrl === bannerUrl && !customBannerPreview && (
                            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-primary-foreground" />
                            </div>
                        )}
                        </button>
                    ))}
                    </div>
                </ScrollArea>
              </>
            ) : (
              selectedGameDetails && (
                <div className="mt-2 p-4 border border-dashed rounded-md bg-muted/20 text-center text-muted-foreground">
                  <ImageOff className="mx-auto h-10 w-10 mb-2 opacity-50"/>
                  <p>No frequent banners available for {selectedGameDetails.name}.</p>
                  <p className="text-xs">You can add them in the game management section.</p>
                </div>
              )
            )}

            <div className="space-y-1.5">
              <Label htmlFor="customBannerUpload" className="flex items-center">Custom Banner (Optional)</Label>
              <input
                  type="file"
                  id="customBannerUpload"
                  ref={customBannerInputRef}
                  onChange={handleCustomBannerUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
              />
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => customBannerInputRef.current?.click()}
                  className="w-full sm:w-auto transform hover:scale-105 transition-transform rounded-lg"
              >
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload Custom Banner
              </Button>
              <p className="text-xs text-muted-foreground">Max 5MB. Overrides frequent banner selection.</p>
            </div>

            {(customBannerPreview || (watchedImageUrl && watchedImageUrl.startsWith('data:image/'))) && (
              <div className="mt-4">
                <Label>Selected Banner Preview:</Label>
                <div className="mt-2 aspect-video w-full max-w-xs rounded-md border overflow-hidden bg-muted/30 backdrop-blur-sm shadow-inner">
                  <Image src={customBannerPreview || watchedImageUrl!} alt="Selected banner preview" fill style={{objectFit:"cover"}} key={customBannerPreview || watchedImageUrl} />
                </div>
              </div>
            )}
             {(!watchedImageUrl || (!watchedImageUrl.startsWith('data:image/') && !(selectedGameDetails?.frequentlyUsedBanners || []).includes(watchedImageUrl))) && !customBannerPreview && (
                <p className="text-xs text-muted-foreground mt-2">No banner selected. A default placeholder will be used if no game-specific default is set.</p>
             )}
            {errors.imageUrl && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.imageUrl.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto transform hover:scale-105 transition-transform rounded-lg">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={
            isSubmitting || 
            games.length === 0 || 
            !watchedGameId || 
            isLoadingGameDetails || 
            (!selectedGameDetails && !!watchedGameId) || 
            (selectedGameDetails && (selectedGameDetails.gameModes || []).length === 0 && !!watchedGameId) ||
            getValues('gameModeId') === 'default' // Disable if gameModeId is still "default"
          } 
          className="w-full sm:w-auto transform hover:scale-105 transition-transform rounded-lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? (isEditMode ? 'Saving Changes...' : 'Creating Tournament...') : (isEditMode ? 'Save Changes' : 'Create Tournament')}
        </Button>
      </div>
    </form>
  );
}
