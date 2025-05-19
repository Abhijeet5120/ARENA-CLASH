// src/app/(main)/[gameId]/tournaments/[tournamentId]/enroll/success/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Eye } from 'lucide-react';

export default function EnrollmentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [tournamentName, setTournamentName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  useEffect(() => {
    const name = searchParams.get('tournamentName');
    const gId = searchParams.get('gameId');
    const tId = searchParams.get('tournamentId');

    setTournamentName(name);
    setGameId(gId);
    setTournamentId(tId);

    if (!name || !gId || !tId) {
      console.warn('Enrollment success page loaded without all necessary parameters.');
    }
  }, [searchParams]); // Removed router from dependencies as it's not used inside this effect

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md text-center shadow-2xl bg-card/80 backdrop-blur-sm rounded-xl">
        <CardHeader className="pt-8">
          <CheckCircle2 className="mx-auto h-24 w-24 text-green-500 animate-breathing mb-4" />
          <CardTitle className="text-3xl font-bold text-foreground">Enrollment Successful!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            You're all set for{' '}
            {tournamentName ? (
              <strong className="text-primary">{tournamentName}</strong>
            ) : (
              'the tournament'
            )}.
            <br />
            Get ready to compete!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 pb-8">
          {gameId && tournamentId && (
            <Button asChild className="w-full text-base py-3 transform hover:scale-105 transition-transform">
              <Link href={`/${gameId}/tournaments/${tournamentId}`}>
                <Eye className="mr-2 h-5 w-5" /> View Tournament Details
              </Link>
            </Button>
          )}
          {gameId && (
             <Button asChild variant="outline" className="w-full text-base py-3 transform hover:scale-105 transition-transform">
              <Link href={`/${gameId}`}>
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to {gameId.charAt(0).toUpperCase() + gameId.slice(1)}
              </Link>
            </Button>
          )}
          {!gameId && (
            <Button asChild variant="outline" className="w-full text-base py-3 transform hover:scale-105 transition-transform">
              <Link href={`/`}>
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to Game Selection
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
