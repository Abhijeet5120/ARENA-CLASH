// src/app/(admin)/admin/tournaments/[tournamentId]/enrollments/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { getTournamentById, type Tournament } from '@/data/tournaments';
import { getEnrollmentsByTournamentId, type Enrollment } from '@/data/enrollments';
import { getUserById } from '@/data/users';
import { format, parseISO, isValid } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, Search, Info, Users2 } from 'lucide-react';

interface EnrollmentWithUserDetails extends Enrollment {
  userDisplayName?: string | null;
  userPhotoURL?: string | null;
}

export default function TournamentEnrollmentsPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithUserDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  const loadData = useCallback(async () => {
    if (!tournamentId) {
      toast({ title: 'Error', description: 'Tournament ID is missing.', variant: 'destructive' });
      router.push('/admin/tournaments');
      return;
    }
    setIsLoading(true);
    try {
      const [fetchedTournament, fetchedEnrollments] = await Promise.all([
        getTournamentById(tournamentId as string),
        getEnrollmentsByTournamentId(tournamentId as string),
      ]);

      if (fetchedTournament) {
        setTournament(fetchedTournament);

        const enrollmentsWithDetails = await Promise.all(
          fetchedEnrollments.map(async (enrollment) => {
            const user = await getUserById(enrollment.userId);
            return {
              ...enrollment,
              userDisplayName: user?.displayName,
              userPhotoURL: user?.photoURL,
            };
          })
        );
        setEnrollments(enrollmentsWithDetails);

      } else {
        toast({ title: 'Error', description: 'Tournament not found.', variant: 'destructive' });
        setTournament(null);
        setEnrollments([]);
        router.push('/admin/tournaments');
      }
    } catch (error) {
      console.error("Failed to load tournament or enrollment data:", error);
      toast({ title: 'Error', description: 'Failed to load tournament or enrollment details.', variant: 'destructive' });
      setTournament(null);
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, toast, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDateDisplay = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "MMM d, yyyy, HH:mm") : "Invalid Date";
    } catch (e) {
      return dateString;
    }
  };

  const filteredEnrollments = useMemo(() => {
    if (!searchTerm) return enrollments;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return enrollments.filter(enrollment =>
      (enrollment.userDisplayName?.toLowerCase() || '').includes(lowercasedSearchTerm) ||
      enrollment.userId.toLowerCase().includes(lowercasedSearchTerm) ||
      enrollment.inGameName.toLowerCase().includes(lowercasedSearchTerm) ||
      enrollment.userEmail.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [enrollments, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
        <p className="ml-4 text-muted-foreground">Loading enrollment data...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Tournament data could not be loaded.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/admin/tournaments">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments List
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="outline" onClick={() => router.push('/admin/tournaments')} className="transform hover:scale-105 transition-transform">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments List
      </Button>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Users className="mr-3 h-7 w-7 text-primary" />
            Enrollments for: {tournament.name}
          </CardTitle>
          <CardDescription>
            List of players enrolled in this tournament. Click on a user to view their details.
            Total Enrollments: {enrollments.length} / {tournament.totalSpots}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              type="search"
              placeholder="Search by name, UID, in-game name, or email..."
              className="w-full pl-10 shadow-sm bg-background/70 backdrop-blur-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredEnrollments.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredEnrollments.map((enrollment, index) => (
                <AccordionItem value={enrollment.id} key={enrollment.id} className="border-b border-border/50 last:border-b-0">
                  <AccordionTrigger className="py-4 px-2 hover:bg-muted/30 rounded-md transition-colors duration-200">
                    <div className="flex items-center">
                      <span className="mr-3 text-sm text-muted-foreground">{index + 1}.</span>
                       <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={enrollment.userPhotoURL || undefined} alt={enrollment.userDisplayName || enrollment.userEmail} />
                        <AvatarFallback>{getInitials(enrollment.userEmail, enrollment.userDisplayName)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{enrollment.userDisplayName || <span className="italic">N/A</span>}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-muted/20 rounded-b-md space-y-2">
                     <div className="flex items-center">
                      <Info className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Profile Name:</span>
                      <span className="ml-2 font-medium text-foreground">{enrollment.userDisplayName || <span className="italic">Not Set</span>}</span>
                    </div>
                    <div className="flex items-center">
                      <Info className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">In-Game Name:</span>
                      <span className="ml-2 font-medium text-foreground">{enrollment.inGameName}</span>
                    </div>
                     <div className="flex items-center">
                      <Info className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="ml-2 font-medium text-foreground">{enrollment.userEmail}</span>
                    </div>
                    <div className="flex items-center">
                      <Info className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Enrolled On:</span>
                      <span className="ml-2 font-medium text-foreground">{formatDateDisplay(enrollment.enrollmentDate)}</span>
                    </div>
                     <div className="flex items-center">
                      <Info className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">User ID:</span>
                       <Button variant="link" asChild className="p-0 h-auto ml-1">
                          <Link href={`/admin/users/${enrollment.userId}`} className="font-mono text-xs text-primary/80 hover:underline">
                            {enrollment.userId}
                          </Link>
                        </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg min-h-[200px] flex flex-col justify-center items-center">
              <Users2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              {searchTerm ? (
                <p className="text-lg">No enrollments found matching "{searchTerm}".</p>
              ) : (
                <p className="text-lg">No players enrolled in this tournament yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
