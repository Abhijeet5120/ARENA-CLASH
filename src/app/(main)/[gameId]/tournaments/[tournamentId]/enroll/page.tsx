// src/app/(main)/[gameId]/tournaments/[tournamentId]/enroll/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EnrollmentForm, type EnrollmentFormValues } from '@/components/tournament/EnrollmentForm';
import { getTournamentById, enrollInTournament, incrementSpotInTournament, type Tournament } from '@/data/tournaments';
import { getGameById, type Game } from '@/data/games';
import { addEnrollment, hasUserEnrolled } from '@/data/enrollments';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, Globe } from 'lucide-react';
import { addTransaction, type CreateTransactionData } from '@/data/transactions';
import { formatCurrency } from '@/lib/utils';

export default function TournamentEnrollPage() {
  const router = useRouter();
  const { gameId, tournamentId } = useParams<{ gameId: string; tournamentId: string }>();

  const { user, isLoggedIn, loading: authLoading, updateUserProfile } = useAuth();
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tournamentId || !gameId) {
        setPageError('Tournament or Game ID is missing from URL.');
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setPageError(null);
    try {
      const [fetchedTournament, fetchedGame] = await Promise.all([
        getTournamentById(tournamentId),
        getGameById(gameId),
      ]);

      if (!fetchedTournament || !fetchedGame || fetchedTournament.gameId !== fetchedGame.id) {
        setPageError('Tournament or game not found, or mismatch.');
        setTournament(null);
        setGame(null);
        setIsLoading(false);
        return;
      }
      
      if (user && fetchedTournament.region !== user.region) {
        setPageError(`This tournament is for the ${fetchedTournament.region} region. Your region is ${user.region}.`);
        setTournament(null); // Prevent enrollment
        setGame(fetchedGame); // Keep game data for context if needed
        setIsLoading(false);
        return;
      }
      
      setTournament(fetchedTournament);
      setGame(fetchedGame);

      if (user && fetchedTournament) {
        const enrolledStatus = await hasUserEnrolled(user.uid, fetchedTournament.id);
        setAlreadyEnrolled(enrolledStatus);
        if (enrolledStatus) {
          toast({
            title: 'Already Enrolled',
            description: `You are already enrolled in ${fetchedTournament.name}.`,
            variant: 'default',
          });
        } else if (fetchedTournament.spotsLeft === 0) {
           setPageError('This tournament is already full.');
        }
      }

    } catch (error) {
      console.error('Error fetching tournament/game data:', error);
      setPageError('Failed to load tournament details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, gameId, user, toast]);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      toast({ title: 'Authentication Required', description: 'Please log in to enroll.', variant: 'destructive' });
      if (gameId && tournamentId) {
        router.push(`/login?redirect=/${gameId}/tournaments/${tournamentId}/enroll`);
      } else {
        router.push('/login');
      }
      return;
    }
    fetchData();
  }, [authLoading, isLoggedIn, router, gameId, tournamentId, fetchData]);

  const handleFormSubmit = async (data: EnrollmentFormValues) => {
    if (!tournament || !game || !user || alreadyEnrolled || tournament.spotsLeft === 0) {
      setPageError('Cannot process enrollment. Please check tournament status or your enrollment.');
      return;
    }
    
    if (tournament.region !== user.region) {
      setPageError(`Enrollment failed: This tournament is for the ${tournament.region} region. Your region is ${user.region}.`);
      return;
    }


    setIsSubmitting(true);
    setPageError(null);

    const entryFee = tournament.entryFee;
    const originalWalletBalance = user.walletBalance ? { ...user.walletBalance } : { winnings: 0, credits: 0 };

    try {
      const currentWinnings = originalWalletBalance.winnings;
      const currentCredits = originalWalletBalance.credits;
      const totalBalance = currentWinnings + currentCredits;
      
      if (totalBalance < entryFee) {
        setPageError(`Insufficient balance. You need ${formatCurrency(entryFee, tournament.entryFeeCurrency)} but only have ${formatCurrency(totalBalance, user.region === 'INDIA' ? 'INR' : 'USD')}.`);
        setIsSubmitting(false);
        return;
      }

      let creditsToDeduct = Math.min(currentCredits, entryFee);
      let winningsToDeduct = 0;
      if (creditsToDeduct < entryFee) {
        winningsToDeduct = entryFee - creditsToDeduct;
      }

      if (currentWinnings < winningsToDeduct) {
        setPageError("Error calculating balance deduction. Winnings insufficient for remaining amount.");
        setIsSubmitting(false);
        return;
      }

      const newCredits = currentCredits - creditsToDeduct;
      const newWinnings = currentWinnings - winningsToDeduct;
      
      const walletUpdatedUser = await updateUserProfile({
        walletBalance: { winnings: newWinnings, credits: newCredits }
      });

      if (!walletUpdatedUser) {
        throw new Error('Failed to update your wallet balance. Please try again.');
      }
      toast({
        title: 'Payment Processed',
        description: `Entry fee of ${formatCurrency(entryFee, tournament.entryFeeCurrency)} deducted. Credits used: ${formatCurrency(creditsToDeduct, user.region === 'INDIA' ? 'INR' : 'USD', false)}, Winnings used: ${formatCurrency(winningsToDeduct, user.region === 'INDIA' ? 'INR' : 'USD', false)}.`,
      });

      let updatedTournamentData;
      try {
        updatedTournamentData = await enrollInTournament(tournament.id);
        if (!updatedTournamentData) throw new Error('Failed to secure tournament spot, possibly full.');
      } catch (spotError: any) {
        await updateUserProfile({ walletBalance: originalWalletBalance }); // Revert wallet
        setPageError(`Failed to secure a spot: ${spotError.message}. Your wallet balance has been restored.`);
        setIsSubmitting(false);
        fetchData(); 
        return;
      }
      
      setTournament(updatedTournamentData);

      const enrollmentData = {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        gameId: game.id,
        userId: user.uid,
        userEmail: user.email!,
        inGameName: data.inGameName,
      };
      let newEnrollment;
      try {
        newEnrollment = await addEnrollment(enrollmentData);
        if (!newEnrollment) throw new Error('Failed to create enrollment record.');
      } catch (enrollError: any) {
        await updateUserProfile({ walletBalance: originalWalletBalance }); // Revert wallet
        await incrementSpotInTournament(tournament.id); // Revert spot
        setPageError(`Enrollment record creation failed: ${enrollError.message}. Your balance and the tournament spot have been restored. Please try again or contact support.`);
        setIsSubmitting(false);
        fetchData();
        return;
      }

      const transactionDescription = `Entry fee for ${tournament.name} (${tournament.region}). Credits used: ${creditsToDeduct.toFixed(2)}, Winnings used: ${winningsToDeduct.toFixed(2)}.`;
      const transactionData: CreateTransactionData = {
        userId: user.uid,
        type: 'tournament_entry',
        amount: -entryFee, 
        currency: tournament.entryFeeCurrency,
        description: transactionDescription,
        relatedId: tournament.id,
      };
      
      try {
        const transactionRecord = await addTransaction(transactionData);
        if (!transactionRecord) throw new Error('Failed to log transaction record.');
      } catch (txError: any) {
        console.error(`CRITICAL: Failed to log transaction for enrollment ${newEnrollment.id}, user ${user.uid}, tournament ${tournament.id}. Wallet was deducted and spot taken. Error: ${txError.message}`);
        setPageError(`Enrollment succeeded but transaction logging failed. Please contact support with details: Enrollment ID ${newEnrollment.id}, Tournament ${tournament.name}.`);
        setIsSubmitting(false); 
        router.push(`/${game.id}/tournaments/${tournament.id}/enroll/success?tournamentName=${encodeURIComponent(tournament.name)}&gameId=${game.id}&tournamentId=${tournament.id}&txLogError=${encodeURIComponent(txError.message)}`);
        router.refresh();
        return;
      }
      
      router.push(`/${game.id}/tournaments/${tournament.id}/enroll/success?tournamentName=${encodeURIComponent(tournament.name)}&gameId=${game.id}&tournamentId=${tournament.id}`);
      router.refresh();

    } catch (error: any) {
      console.error('Enrollment process failed:', error);
      setPageError(error.message || 'An unexpected error occurred during enrollment.');
      // Attempt to revert wallet if it was deducted but other steps failed.
      // This is a simplified rollback attempt for local file storage.
      // More robust transaction management would be needed for a real DB.
      if (user && (user.walletBalance.credits !== originalWalletBalance.credits || user.walletBalance.winnings !== originalWalletBalance.winnings)) {
        await updateUserProfile({ walletBalance: originalWalletBalance });
        toast({ title: "Wallet Reverted", description: "An error occurred, your wallet balance has been restored.", variant: "destructive"});
      }
      fetchData(); 
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Spinner size="large" />
        <p className="ml-3 text-muted-foreground">Loading enrollment details...</p>
      </div>
    );
  }
  
  if (pageError && tournament === null && game !== null) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <Globe className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Region Mismatch</h2>
        <p className="text-muted-foreground mb-6">{pageError}</p>
        <Button asChild variant="outline">
          <Link href={gameId ? `/${gameId}/tournaments` : `/`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments
          </Link>
        </Button>
      </div>
    );
  }


  if (pageError && !tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Enrollment Error</h2>
        <p className="text-muted-foreground mb-6">{pageError}</p>
        <Button asChild variant="outline">
          <Link href={gameId ? `/${gameId}/tournaments` : `/`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments
          </Link>
        </Button>
      </div>
    );
  }

  if (!tournament || !game) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground mb-6">Tournament or game data could not be loaded.</p>
         <Button asChild variant="outline">
           <Link href={gameId ? `/${gameId}/tournaments` : `/`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments
          </Link>
        </Button>
      </div>
    );
  }

  if (alreadyEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4 animate-in fade-in duration-300">
         <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Already Enrolled</h2>
        <p className="text-muted-foreground mb-6">You are already enrolled in <strong>{tournament.name}</strong>.</p>
        <div className="flex space-x-4">
            <Button asChild variant="default">
                <Link href={`/${game.id}/tournaments/${tournament.id}`}>View Tournament</Link>
            </Button>
            <Button asChild variant="outline">
                <Link href={`/${game.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to {game.name}
                </Link>
            </Button>
        </div>
      </div>
    );
  }

  if (tournament.spotsLeft === 0 && !alreadyEnrolled) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4 animate-in fade-in duration-300">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Tournament Full</h2>
        <p className="text-muted-foreground mb-6">Sorry, <strong>{tournament.name}</strong> is currently full.</p>
        <Button asChild variant="outline">
          <Link href={`/${game.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {game.name}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6 transform hover:scale-105 transition-transform">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <EnrollmentForm
        tournament={tournament}
        game={game}
        onSubmit={handleFormSubmit}
        onCancel={() => router.push(`/${game.id}/tournaments/${tournament.id}`)}
        isLoading={isSubmitting}
        error={pageError}
        entryFee={tournament.entryFee}
        entryFeeCurrency={tournament.entryFeeCurrency}
        userRegion={user?.region || 'USA'}
      />
    </div>
  );
}
