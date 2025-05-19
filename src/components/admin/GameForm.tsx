// src/components/admin/GameForm.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Game } from '@/data/games';
import { Save, XCircle, AlertCircle, ImageIcon, CloudUpload } from 'lucide-react'; 
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const gameFormSchema = z.object({
  id: z.string()
    .min(3, 'Game ID must be at least 3 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Game ID must be a valid slug (e.g., my-cool-game)'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  iconImageUrl: z.string().url('Must be a valid URL for game icon or a data URI.').optional().or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL for game logo/card or a data URI.').optional().or(z.literal('')),
  bannerImageUrl: z.string().url('Must be a valid URL for game page banner or a data URI.').optional().or(z.literal('')),
  themeGradient: z.string().optional().or(z.literal('')),
  dataAiHint: z.string().max(50, "AI Hint should be max 50 characters").optional().or(z.literal('')),
});

export type GameFormValues = z.infer<typeof gameFormSchema>;

interface GameFormProps {
  onSubmit: (data: GameFormValues) => Promise<void> | void;
  initialData?: Game | null; 
  onCancel: () => void;
  isEditMode?: boolean;
}

export function GameForm({ onSubmit, initialData, onCancel, isEditMode = false }: GameFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      iconImageUrl: initialData.iconImageUrl || '',
      imageUrl: initialData.imageUrl || '',
      bannerImageUrl: initialData.bannerImageUrl || '',
      themeGradient: initialData.themeGradient || '',
      dataAiHint: initialData.dataAiHint || '',
    } : {
      id: '',
      name: '',
      description: '',
      iconImageUrl: '', 
      imageUrl: '',
      bannerImageUrl: '',
      themeGradient: 'from-slate-500 to-slate-700',
      dataAiHint: '',
    },
  });
  
  const watchedName = watch('name');
  const watchedIconImageUrl = watch('iconImageUrl');
  const watchedImageUrl = watch('imageUrl');
  const watchedBannerImageUrl = watch('bannerImageUrl');
  
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditMode && watchedName) {
      const slug = watchedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setValue('id', slug, { shouldValidate: true });
    }
  }, [watchedName, setValue, isEditMode]);


  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        iconImageUrl: initialData.iconImageUrl || '',
        imageUrl: initialData.imageUrl || '',
        bannerImageUrl: initialData.bannerImageUrl || '',
        themeGradient: initialData.themeGradient || '',
        dataAiHint: initialData.dataAiHint || '',
      });
    } else {
       const defaultId = ''; 
       const defaultName = '';
        reset({
            id: defaultId,
            name: defaultName,
            description: '',
            iconImageUrl: `https://picsum.photos/seed/${defaultId || 'newgame'}-icon/100/100`,
            imageUrl: `https://picsum.photos/seed/${defaultId || 'newgame'}/300/200`,
            bannerImageUrl: `https://picsum.photos/seed/${defaultId || 'newgame'}-banner/1200/400`,
            themeGradient: 'from-slate-500 to-slate-700',
            dataAiHint: `${defaultName.toLowerCase()} game`,
        });
    }
  }, [initialData, reset]); 

  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldToSet: keyof GameFormValues, // 'iconImageUrl' | 'imageUrl' | 'bannerImageUrl'
    options?: { maxSizeMB?: number; toastTitle?: string }
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      setValue(fieldToSet, reader.result as string, {shouldValidate: true});
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-4">
      <Card className="bg-card/80 backdrop-blur-sm shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">{isEditMode ? 'Edit Game' : 'Create New Game'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update the details for this game.' : 'Provide the details for the new game.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Game Name</Label>
            <Input id="name" {...register('name')} className={errors.name ? 'border-destructive' : ''} placeholder="e.g., Arena Legends" />
            {errors.name && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="id">Game ID (Slug)</Label>
            <Input id="id" {...register('id')} className={errors.id ? 'border-destructive' : ''} placeholder="e.g., arena-legends" disabled={isEditMode} />
            {isEditMode && <p className="text-xs text-muted-foreground mt-1">Game ID cannot be changed after creation.</p>}
            {!isEditMode && <p className="text-xs text-muted-foreground mt-1">Auto-generated from name. Must be unique, lowercase, and use hyphens for spaces.</p>}
            {errors.id && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.id.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Enter a brief description of the game..." className={errors.description ? 'border-destructive' : ''} rows={3}/>
            {errors.description && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.description.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Visuals & Presentation</CardTitle>
          <CardDescription>Icon, images, and theme for the game's appearance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="iconImageUrl" className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Game Icon</Label>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Image
                    src={watchedIconImageUrl || `https://picsum.photos/seed/${watch('id') || 'newgame'}-icon/100/100`}
                    alt="Current game icon"
                    width={100}
                    height={100}
                    className="rounded-md object-cover aspect-square border shadow-sm"
                    key={watchedIconImageUrl ? `thumb-icon-${watchedIconImageUrl}` : `thumb-icon-default-${watch('id')}`}
                />
                <input
                    type="file"
                    id="iconUpload"
                    ref={iconInputRef}
                    onChange={(e) => handleFileSelection(e, 'iconImageUrl', {maxSizeMB: 1, toastTitle: 'Game Icon Updated'})}
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
            <p className="text-xs text-muted-foreground">Upload game icon (recommended 1:1 aspect ratio, max 1MB).</p>
            {errors.iconImageUrl && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.iconImageUrl.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="imageUrl">Game Logo/Card Image URL (Optional)</Label>
            <Input id="imageUrl" type="url" {...register('imageUrl')} placeholder="https://example.com/game-logo.png or leave for Data URI" className={errors.imageUrl ? 'border-destructive' : ''} />
            {errors.imageUrl && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.imageUrl.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">Image for the game selection card. Upload via Game Details page or provide URL. If empty, a placeholder will be used.</p>
          </div>

          <div>
            <Label htmlFor="bannerImageUrl">Game Page Banner Image URL (Optional)</Label>
            <Input id="bannerImageUrl" type="url" {...register('bannerImageUrl')} placeholder="https://example.com/game-banner.png or leave for Data URI" className={errors.bannerImageUrl ? 'border-destructive' : ''} />
            {errors.bannerImageUrl && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.bannerImageUrl.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">Main banner for the game's dedicated page. Upload via Game Details page or provide URL. If empty, a placeholder will be used.</p>
          </div>

          <div>
            <Label htmlFor="themeGradient">Theme Gradient CSS Class (Optional)</Label>
            <Input id="themeGradient" {...register('themeGradient')} placeholder="e.g., from-blue-500 to-purple-600" className={errors.themeGradient ? 'border-destructive' : ''} />
            {errors.themeGradient && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.themeGradient.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">Tailwind CSS classes for banner overlay. e.g., "from-blue-500 to-purple-600".</p>
          </div>

          <div>
            <Label htmlFor="dataAiHint">AI Hint for Placeholder Images (Optional)</Label>
            <Input id="dataAiHint" {...register('dataAiHint')} placeholder="e.g., esports competition, fantasy battle" className={errors.dataAiHint ? 'border-destructive' : ''} />
            {errors.dataAiHint && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.dataAiHint.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">One or two keywords for placeholder images if URLs are not provided.</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="transform hover:scale-105 transition-transform rounded-lg"> 
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="transform hover:scale-105 transition-transform rounded-lg"> 
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? (isEditMode ? 'Saving Changes...' : 'Creating Game...') : (isEditMode ? 'Save Changes' : 'Create Game')}
        </Button>
      </div>
    </form>
  );
}
