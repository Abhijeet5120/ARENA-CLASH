// src/components/tournament/TournamentEnrollButton.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Ticket, LogIn, CheckCircle2, XCircle, Globe } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { hasUserEnrolled } from '@/data/enrollments';
import type { UserRegion } from '@/data/users';

interface TournamentEnrollButtonProps {
  tournamentId: string;
  gameId: string;
  spotsLeft: number;
  tournamentName: string;
  entryFee?: number;
  tournamentRegion: UserRegion;
  tournamentCurrency: 'USD' | 'INR';
  currentUserRegion: UserRegion; 
}

export function TournamentEnrollButton({
  tournamentId,
  gameId,
  spotsLeft,
  tournamentName,
  entryFee,
  tournamentRegion,
  tournamentCurrency,
  currentUserRegion
}: TournamentEnrollButtonProps) {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);

  const checkEnrollmentStatus = useCallback(async () => {
    if (isLoggedIn && user) {
      setIsCheckingEnrollment(true);
      try {
        const enrolled = await hasUserEnrolled(user.uid, tournamentId);
        setIsEnrolled(enrolled);
      } catch (error) {
        console.error("Failed to check enrollment status:", error);
      } finally {
        setIsCheckingEnrollment(false);
      }
    } else {
      setIsEnrolled(false);
      setIsCheckingEnrollment(false);
    }
  }, [isLoggedIn, user, tournamentId]);

  useEffect(() => {
    checkEnrollmentStatus();
  }, [checkEnrollmentStatus]);

  const handleNavigation = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/${gameId}/tournaments/${tournamentId}/enroll`);
    } else {
      router.push(`/${gameId}/tournaments/${tournamentId}/enroll`);
    }
  };

  const isTournamentFull = spotsLeft === 0;
  const entryFeeDisplay = entryFee !== undefined ? formatCurrency(entryFee, tournamentCurrency, false) : ''; 

  const buttonBaseClasses = "w-full text-sm sm:text-base py-2.5 sm:py-3 shadow-md hover:shadow-lg transition-transform duration-200 hover:scale-105";
  const iconBaseClasses = "mr-2 h-4 w-4 sm:h-5 sm:w-5";

  if (authLoading || isCheckingEnrollment) {
    return (
      <Button
        variant="default"
        className={buttonBaseClasses}
        aria-label={`Loading enrollment status for ${tournamentName}`}
        disabled={true}
      >
        <Ticket className={`${iconBaseClasses} animate-pulse`} />
        Checking Status...
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button
        onClick={handleNavigation}
        variant="outline"
        className={buttonBaseClasses}
        aria-label={`Log in to enroll in ${tournamentName}`}
      >
        <LogIn className={iconBaseClasses} />
        Log In to Enroll {entryFeeDisplay && `(${entryFeeDisplay})`}
      </Button>
    );
  }

  // Logged-in user checks
  if (currentUserRegion !== tournamentRegion) {
    return (
      <Button
        variant="outline"
        className={`${buttonBaseClasses} cursor-not-allowed text-muted-foreground`}
        aria-label={`Tournament not available in your region`}
        disabled={true}
      >
        <Globe className={iconBaseClasses} />
        Not in Your Region ({tournamentRegion})
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button
        variant="secondary"
        className={`${buttonBaseClasses} cursor-not-allowed`}
        aria-label={`Already enrolled in ${tournamentName}`}
        disabled={true}
      >
        <CheckCircle2 className={`${iconBaseClasses} text-green-500`} />
        Already Enrolled
      </Button>
    );
  }

  if (isTournamentFull) {
    return (
      <Button
        variant="destructive"
        className={`${buttonBaseClasses} cursor-not-allowed`}
        aria-label={`${tournamentName} is full`}
        disabled={true}
      >
        <XCircle className={iconBaseClasses} />
        Tournament Full
      </Button>
    );
  }

  return (
    <Button
      onClick={handleNavigation}
      variant="default"
      className={buttonBaseClasses}
      aria-label={`Enroll in ${tournamentName}`}
      disabled={entryFee === undefined}
    >
      <Ticket className={iconBaseClasses} />
      Enroll Now {entryFeeDisplay && `(${entryFeeDisplay})`}
    </Button>
  );
}
