// src/app/(admin)/admin/users/[userId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserById, type UserRecord } from '@/data/users';
import { getEnrollmentsByUserId, type Enrollment } from '@/data/enrollments';
import { getTournamentById, type Tournament } from '@/data/tournaments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, User, Mail, BadgeInfo, CalendarCheck, FileText, Trophy, Eye, ShieldCheck } from 'lucide-react';

interface UserEnrollmentDetails extends Enrollment {
  tournamentDetails?: Tournament;
}

export default function AdminUserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<UserRecord | null>(null);
  const [enrollments, setEnrollments] = useState<UserEnrollmentDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingEnrollments, setIsFetchingEnrollments] = useState(false);

  const loadUserData = useCallback(async (currentUserId: string) => {
    setIsLoading(true);
    setIsFetchingEnrollments(true);
    try {
      const fetchedUser = await getUserById(currentUserId);
      if (fetchedUser) {
        setUser(fetchedUser);
        const userEnrollments = await getEnrollmentsByUserId(fetchedUser.uid);
        const enrollmentsWithDetails: UserEnrollmentDetails[] = await Promise.all(
          userEnrollments.map(async (enrollment) => {
            const tournamentDetails = await getTournamentById(enrollment.tournamentId);
            return { ...enrollment, tournamentDetails: tournamentDetails || undefined };
          })
        );
        setEnrollments(enrollmentsWithDetails);
      } else {
        toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
        setUser(null);
        setEnrollments([]);
        router.push('/admin/users');
      }
    } catch (error) {
      console.error("Failed to load user data or enrollments:", error);
      toast({ title: 'Error', description: 'Failed to load user details or enrollments.', variant: 'destructive' });
      setUser(null);
      setEnrollments([]);
    } finally {
      setIsLoading(false);
      setIsFetchingEnrollments(false);
    }
  }, [toast, router]);

  useEffect(() => {
    if (userId) {
      loadUserData(userId as string);
    } else {
        setIsLoading(false);
        toast({ title: 'Error', description: 'User ID missing.', variant: 'destructive' });
        router.push('/admin/users');
    }
  }, [userId, loadUserData, router, toast]);

  const formatDate = (timestamp: number | string | undefined, includeTime = true) => {
    if (!timestamp) return 'N/A';
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid Date";
      const formatString = includeTime ? "MMM d, yyyy, HH:mm zzz" : "MMM d, yyyy";
      return format(date, formatString);
    } catch (e) {
      return "Invalid Date";
    }
  };

  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
        <p className="ml-4 text-muted-foreground">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">User not found or could not be loaded.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users List
          </Link>
        </Button>
      </div>
    );
  }

  const isAdminUser = user.email.toLowerCase() === 'admin@example.com';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Button variant="outline" onClick={() => router.push('/admin/users')} className="transform hover:scale-105 transition-transform">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users List
      </Button>

      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center">
          <User className="mr-3 h-10 w-10 text-primary" /> User Profile: {user.displayName || user.email}
        </h1>
        <p className="text-lg text-muted-foreground">Detailed information for user ID: {user.uid}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
          <CardHeader className="items-center text-center bg-muted/30">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background transform transition-transform hover:scale-110 duration-300">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
              <AvatarFallback className="text-3xl">
                {getInitials(user.email, user.displayName)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user.displayName || <span className="italic">No Display Name</span>}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
             {isAdminUser && (
                <Badge variant="default" className="mt-2 bg-primary/80 text-primary-foreground shadow-sm">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Admin
                </Badge>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center">
              <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center">
              <BadgeInfo className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="text-sm">UID: <Badge variant="outline" className="font-mono text-xs">{user.uid}</Badge></span>
            </div>
            <div className="flex items-center">
              <CalendarCheck className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Joined: {formatDate(user.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="mr-3 h-7 w-7 text-primary" />
              Activity & Details
            </CardTitle>
            <CardDescription>Further details and activity logs for this user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              More specific user activity, preferences, or administrative notes would appear here.
              Currently, this section is a placeholder for future enhancements like activity logs or role management.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Trophy className="mr-3 h-7 w-7 text-primary" />
            Tournament History ({enrollments.length})
          </CardTitle>
          <CardDescription>
            Tournaments this user has participated in or is enrolled in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetchingEnrollments ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="medium" /><p className="ml-2 text-muted-foreground">Loading enrollments...</p>
            </div>
          ) : enrollments.length > 0 ? (
            <ul className="space-y-3">
              {enrollments.map((enrollment) => (
                <li key={enrollment.id} className="p-4 bg-muted/30 rounded-lg shadow-sm hover:bg-muted/40 hover:backdrop-blur-sm transition-colors duration-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-foreground">{enrollment.tournamentDetails?.name || enrollment.tournamentName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Game: {enrollment.tournamentDetails?.gameId || enrollment.gameId} | Enrolled: {formatDate(enrollment.enrollmentDate, false)}
                    </p>
                     <p className="text-sm text-muted-foreground">
                      In-Game Name: <span className="font-medium text-foreground/80">{enrollment.inGameName}</span>
                    </p>
                  </div>
                  {enrollment.tournamentDetails && (
                    <Button variant="outline" size="sm" asChild className="transform hover:scale-105 transition-transform">
                       <Link href={`/${enrollment.gameId}/tournaments/${enrollment.tournamentId}`} target="_blank">
                        View <Eye className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted/50 rounded-lg">
              <p className="text-lg">No tournament history available for this user yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
