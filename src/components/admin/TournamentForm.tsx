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
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { Save, XCircle, AlertCircle, UploadCloud, CheckCircle, ImageOff, Puzzle, SparklesIcon, CalendarDays, Settings, Info, DollarSign, Users, Crown, Images, Layers } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '../ui/separator';


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
  
  // React state for game details (game modes, frequent banners) of the selected game
  const [selectedGameDetails, setSelectedGameDetails] = useState<Game | null>(null);
  const [isLoadingGameDetails, setIsLoadingGameDetails] = useState(false);
  
  // React state for custom banner preview (when user uploads a new file)
  const [customBannerPreview, setCustomBannerPreview] = useState<string | null>(null);
  const customBannerInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!initialData;
  const defaultEntryFeeCurrency = adminSelectedRegion === 'INDIA' ? 'INR' : 'USD';
  const defaultRegion = adminSelectedRegion;

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue, watch, getValues } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    // Default values are set in the useEffect hook below to handle async game data
  });

  const watchedGameId = watch('gameId');
  const watchedImageUrl = watch('imageUrl'); // This will hold the selected frequent banner URL or custom banner data URI
  const watchedTournamentDate = watch('tournamentDate');


  // Effect for initial form population and when initialData/games change
  useEffect(() => {
    const initializeForm = async () => {
      setIsLoadingGameDetails(true);
      const gameIdToLoad = isEditMode ? initialData?.gameId : (games.length > 0 ? games[0].id : '');
      let gameDataForInit: Game | null = null;

      if (gameIdToLoad) {
        try {
          gameDataForInit = await getGameById(gameIdToLoad);
          setSelectedGameDetails(gameDataForInit); // Update React state for game details
        } catch (error) {
          toast({ title: "Error", description: "Could not load initial game details.", variant: "destructive" });
          setSelectedGameDetails(null);
        }
      }

      const defaultGameModeId = gameDataForInit?.gameModes?.[0]?.id || 'default';
      const defaultImageUrl = gameDataForInit?.frequentlyUsedBanners?.[0] || gameDataForInit?.bannerImageUrl || gameDataForInit?.imageUrl || '';

      if (isEditMode && initialData) {
        reset({
          ...initialData,
          tournamentDate: initialData.tournamentDate ? new Date(initialData.tournamentDate) : undefined,
          registrationCloseDate: initialData.registrationCloseDate ? new Date(initialData.registrationCloseDate) : undefined,
          gameModeId: initialData.gameModeId || defaultGameModeId,
          imageUrl: initialData.imageUrl || defaultImageUrl, // Prioritize initialData's image
          entryFeeCurrency: initialData.entryFeeCurrency || defaultEntryFeeCurrency,
          region: initialData.region || defaultRegion,
          isSpecial: initialData.isSpecial || false,
        });
        // If initialData.imageUrl is a data URI, it's a custom one
        if (initialData.imageUrl && initialData.imageUrl.startsWith('data:image/')) {
          setCustomBannerPreview(initialData.imageUrl);
        } else {
          setCustomBannerPreview(null); // If it's a URL (frequent or old custom), clear custom preview
        }
      } else {
        reset({ // For new tournament
          name: '',
          gameId: gameIdToLoad,
          gameModeId: defaultGameModeId,
          isSpecial: false,
          tournamentDate: undefined,
          registrationCloseDate: undefined,
          entryFee: 0,
          entryFeeCurrency: defaultEntryFeeCurrency,
          region: defaultRegion,
          prizePool: '',
          imageUrl: defaultImageUrl, // Use default from game
          totalSpots: 32,
        });
        setCustomBannerPreview(null);
      }
      setIsLoadingGameDetails(false);
    };

    if (games.length > 0 || isEditMode) {
      initializeForm();
    } else {
      // Reset with defaults for an empty form if no games and not edit mode
      reset({
        name: '',
        gameId: '',
        gameModeId: 'default',
        isSpecial: false,
        tournamentDate: undefined,
        registrationCloseDate: undefined,
        entryFee: 0,
        entryFeeCurrency: defaultEntryFeeCurrency,
        region: defaultRegion,
        prizePool: '',
        imageUrl: '',
        totalSpots: 32,
      });
      setIsLoadingGameDetails(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, initialData, games, reset, toast, defaultEntryFeeCurrency, defaultRegion]);


  // Effect to update game-dependent fields when watchedGameId changes
  useEffect(() => {
    const updateFormForNewGame = async () => {
      if (!watchedGameId) {
        setSelectedGameDetails(null);
        setValue('gameModeId', 'default');
        setValue('imageUrl', '');
        setCustomBannerPreview(null);
        return;
      }

      // Avoid re-fetch if the selected game is the same as the current details
      if (selectedGameDetails && selectedGameDetails.id === watchedGameId) {
        // Ensure game mode is set if it was default and options are available
        if (getValues('gameModeId') === 'default' && (selectedGameDetails.gameModes || []).length > 0) {
          setValue('gameModeId', selectedGameDetails.gameModes[0].id, { shouldDirty: true, shouldTouch: true });
        }
        return;
      }

      setIsLoadingGameDetails(true);
      try {
        const gameData = await getGameById(watchedGameId);
        setSelectedGameDetails(gameData); // Update React state for game details

        const newGameModeId = gameData?.gameModes?.[0]?.id || 'default';
        setValue('gameModeId', newGameModeId, { shouldDirty: true, shouldTouch: true });

        // Only update imageUrl if it's not a custom banner (data URI)
        const currentImageUrl = getValues('imageUrl');
        if (!currentImageUrl || !currentImageUrl.startsWith('data:image/')) {
          setValue('imageUrl', gameData?.frequentlyUsedBanners?.[0] || gameData?.bannerImageUrl || gameData?.imageUrl || '', { shouldDirty: true, shouldTouch: true });
        }
        setCustomBannerPreview(null); // Clear custom preview when game changes unless it was just set

      } catch (error) {
        toast({ title: "Error", description: "Could not load details for the selected game.", variant: "destructive" });
        setSelectedGameDetails(null);
        setValue('gameModeId', 'default');
        setValue('imageUrl', '');
        setCustomBannerPreview(null);
      } finally {
        setIsLoadingGameDetails(false);
      }
    };
    
    // Condition to run:
    // 1. If watchedGameId is truthy.
    // 2. If it's not edit mode, OR if it is edit mode AND the watchedGameId is different from initialData's gameId.
    //    This prevents resetting fields if the form is just loading for editing an existing tournament.
    if (watchedGameId && (!isEditMode || (isEditMode && watchedGameId !== initialData?.gameId))) {
        updateFormForNewGame();
    } else if (!watchedGameId && selectedGameDetails) {
        // Clear if gameId is unselected
        setSelectedGameDetails(null);
        setValue('gameModeId', 'default');
        setValue('imageUrl', '');
        setCustomBannerPreview(null);
    }

  }, [watchedGameId, isEditMode, initialData?.gameId, setValue, getValues, toast, selectedGameDetails]);


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
      setValue('imageUrl', dataUri, { shouldValidate: true, shouldDirty: true }); // Set RHF value
      setCustomBannerPreview(dataUri); // Set React state for preview
      toast({ title: 'Custom Banner Selected', description: 'Preview updated. Save changes to apply.' });
    };
    reader.onerror = () => {
      toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    };
    reader.readAsDataURL(file);
    if(event.target) event.target.value = ''; // Reset file input
  };
  
  const previewSrc = customBannerPreview || watchedImageUrl;


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
      <input type="hidden" {...register('region')} value={adminSelectedRegion}/>
      <input type="hidden" {...register('entryFeeCurrency')} value={adminSelectedRegion === 'INDIA' ? 'INR' : 'USD'} />

      <Card className="bg-card/80 backdrop-blur-sm shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Layers className="mr-2 h-5 w-5 text-primary"/>Core Details</CardTitle>
          <CardDescription>Basic information about the tournament for the <span className="font-semibold">{getValues('region')}</span> region.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tournament Name</Label>
            <Input id="name" {...register('name')} className={errors.name ? 'border-destructive' : ''} placeholder="e.g., Summer Skirmish Series" />
            {errors.name && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.name.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gameId">Game</Label>
              <Controller
                name="gameId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Game change logic is handled by useEffect watching watchedGameId
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
                key={selectedGameDetails?.id || 'no-game-selected-for-mode'} // Force re-mount when game details change
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
              <Label htmlFor="entryFee" className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground"/>Entry Fee ({getValues('entryFeeCurrency')})</Label>
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
                            setValue('imageUrl', bannerUrl, {shouldValidate: true, shouldDirty: true});
                            setCustomBannerPreview(null); // Clear custom preview if a frequent banner is selected
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

            {previewSrc && (
              <div className="mt-4">
                <Label>Selected Banner Preview:</Label>
                <div className="mt-2 aspect-video w-full max-w-xs rounded-md border overflow-hidden bg-muted/30 backdrop-blur-sm shadow-inner">
                  <Image src={previewSrc} alt="Selected banner preview" fill style={{objectFit:"cover"}} key={previewSrc} />
                </div>
              </div>
            )}
            {!previewSrc && (
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
            getValues('gameModeId') === 'default'
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
