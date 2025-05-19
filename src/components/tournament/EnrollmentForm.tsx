// src/components/tournament/EnrollmentForm.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tournament } from '@/data/tournaments';
import type { Game } from '@/data/games';
import { Spinner } from '@/components/ui/spinner';
import { UserSquare2, AlertCircle, Globe } from 'lucide-react'; 
import { formatCurrency } from '@/lib/utils';
import type { UserRegion } from '@/data/users';

const enrollmentFormSchema = z.object({
  inGameName: z.string().min(3, 'In-game name must be at least 3 characters').max(50, 'In-game name must be 50 characters or less'),
});

export type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

interface EnrollmentFormProps {
  tournament: Tournament;
  game: Game;
  onSubmit: (data: EnrollmentFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error?: string | null;
  entryFee: number;
  entryFeeCurrency: 'USD' | 'INR';
  userRegion: UserRegion; 
}

export function EnrollmentForm({ tournament, game, onSubmit, onCancel, isLoading, error, entryFee, entryFeeCurrency, userRegion }: EnrollmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      inGameName: '',
    },
  });

  const entryFeeDisplay = formatCurrency(entryFee, entryFeeCurrency);
  const walletCurrencySymbol = userRegion === 'INDIA' ? '₹' : '$';

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl bg-card/80 backdrop-blur-sm animate-in fade-in duration-500 rounded-xl">
      <CardHeader className="text-center p-4 sm:p-6">
        <UserSquare2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary mb-2 sm:mb-3" /> 
        <CardTitle className="text-2xl sm:text-3xl font-bold">Enroll in Tournament</CardTitle>
        <CardDescription className="space-y-1 text-sm sm:text-base pt-1">
            <p>You are enrolling in <strong>{tournament.name}</strong> for <strong>{game.name}</strong>.</p>
            <p className="flex items-center justify-center text-xs sm:text-sm"><Globe className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground"/>Tournament Region: <span className="font-semibold ml-1">{tournament.region}</span></p>
            <p>Entry Fee: <strong className="text-primary">{entryFeeDisplay}</strong></p>
            {tournament.entryFeeCurrency !== (userRegion === 'INDIA' ? 'INR' : 'USD') && (
              <p className="text-xs text-muted-foreground">
                (Your wallet will be charged in your preferred currency: {walletCurrencySymbol})
              </p>
            )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="inGameName" className="flex items-center text-sm sm:text-base">
              In-Game Name / UID
            </Label>
            <Input
              id="inGameName"
              type="text"
              placeholder="YourCoolGamerTag123"
              {...register('inGameName')}
              className={`${errors.inGameName ? 'border-destructive' : ''} text-sm sm:text-base p-2.5 sm:p-3`}
              aria-invalid={errors.inGameName ? "true" : "false"}
            />
            {errors.inGameName && (
              <p className="text-xs sm:text-sm text-destructive flex items-center mt-1">
                <AlertCircle className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {errors.inGameName.message}
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2.5 sm:p-3 rounded-md flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              {error}
            </div>
          )}

          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 p-0 pt-4 sm:pt-6">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3 transform hover:scale-105 transition-transform">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3 transform hover:scale-105 transition-transform" disabled={isLoading}>
              {isLoading ? <Spinner size="small" className="mr-2" /> : null}
              {isLoading ? 'Enrolling...' : `Confirm & Pay ${entryFeeDisplay}`}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
