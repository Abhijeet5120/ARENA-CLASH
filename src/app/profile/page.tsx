
// src/app/profile/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { getEnrollmentsByUserId, type Enrollment } from '@/data/enrollments';
import { getTournamentById, type Tournament } from '@/data/tournaments';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label'; // Added import
import { LogOut, ImagePlus, Camera, Mail, ShieldCheck, CalendarCheck, Trophy, DollarSign, ListChecks, HelpCircle, Eye, Wallet, CreditCard, Globe, Edit3, History, Banknote, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { UserRegion } from '@/data/users';
import { Separator } from '@/components/ui/separator';


interface EnrolledTournamentDetails extends Enrollment {
  tournamentDetails?: Tournament;
}

export default function ProfilePage() {
  const { user, loading, isLoggedIn, logout, updateUserProfile, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [enrolledTournaments, setEnrolledTournaments] = useState<EnrolledTournamentDetails[]>([]);
  const [isFetchingEnrollments, setIsFetchingEnrollments] = useState(false);
  const [isUploading, setIsUploading] = useState<'profile' | 'banner' | null>(null);
  const [targetSavingRegion, setTargetSavingRegion] = useState<UserRegion | null>(null);


  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, router, user]);

  const fetchUserEnrollments = useCallback(async () => {
    if (user && isLoggedIn) {
      setIsFetchingEnrollments(true);
      try {
        const enrollments = await getEnrollmentsByUserId(user.uid);
        const tournamentsWithDetails: EnrolledTournamentDetails[] = await Promise.all(
          enrollments.map(async (enrollment) => {
            const tournamentDetails = await getTournamentById(enrollment.tournamentId);
            return { ...enrollment, tournamentDetails: tournamentDetails || undefined };
          })
        );
        setEnrolledTournaments(tournamentsWithDetails);
      } catch (error) {
        console.error("Failed to fetch user enrollments:", error);
        toast({
          title: "Error",
          description: "Could not load your tournament enrollments.",
          variant: "destructive"
        });
      } finally {
        setIsFetchingEnrollments(false);
      }
    }
  }, [user, isLoggedIn, toast]);

  useEffect(() => {
    fetchUserEnrollments();
  }, [fetchUserEnrollments]);


  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid File Type', description: 'Please select an image file.', variant: 'destructive' });
        return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ title: 'File Too Large', description: 'Please select an image smaller than 10MB.', variant: 'destructive' });
        return;
    }

    setIsUploading(type);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      try {
        const updates = type === 'profile' ? { photoURL: dataUri } : { bannerURL: dataUri };
        const updatedUser = await updateUserProfile(updates);
        if (updatedUser) {
          toast({ title: `${type === 'profile' ? 'Profile Picture' : 'Banner'} Updated`, description: 'Your changes have been saved.' });
        } else {
          throw new Error(`Failed to update ${type}.`);
        }
      } catch (error: any) {
        toast({ title: 'Update Failed', description: error.message || `Could not update ${type}.`, variant: 'destructive' });
      } finally {
        setIsUploading(null);
        if (event.target) event.target.value = '';
      }
    };
    reader.onerror = () => {
        toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
        setIsUploading(null);
    };
  };

  const handleAdminRegionChange = async (newRegion: UserRegion) => {
    if (!user || newRegion === user.region || !isAdmin) return;
    setTargetSavingRegion(newRegion);
    try {
      const updatedUser = await updateUserProfile({ region: newRegion });
      if (updatedUser) {
        toast({ title: 'Profile Region Updated', description: `Your profile region has been set to ${newRegion}.` });
      } else {
        toast({ title: 'Region Update Failed', description: 'Could not update your profile region. Context reported failure.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Error updating admin region:", error);
      toast({ title: 'Error Updating Region', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setTargetSavingRegion(null);
    }
  };


  if (loading || !isLoggedIn || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
      </div>
    );
  }
  
  const userCurrencyCode = user.region === 'INDIA' ? 'INR' : 'USD';
  const userCurrencySymbol = user.region === 'INDIA' ? '₹' : '$';
  const winningsAmount = user.walletBalance?.winnings || 0;
  // Debug log:
  console.log("ProfilePage - User Region:", user.region, "Derived Currency Code for Winnings:", userCurrencyCode);
  const formattedWinningsNumber = formatCurrency(winningsAmount, userCurrencyCode, true, false); // Pass false for not prepending symbol IF K/M is used

  const memberSinceDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A';
  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };


  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 animate-in fade-in duration-500">
      <input
        type="file"
        accept="image/*"
        ref={profilePicInputRef}
        onChange={(e) => handleFileChange(e, 'profile')}
        style={{ display: 'none' }}
        id="profilePicInput"
      />
      <input
        type="file"
        accept="image/*"
        ref={bannerInputRef}
        onChange={(e) => handleFileChange(e, 'banner')}
        style={{ display: 'none' }}
        id="bannerInput"
      />

      <div className="relative h-32 sm:h-40 md:h-56 mb-[-2.5rem] sm:mb-[-3rem] md:mb-[-4rem] rounded-lg sm:rounded-xl overflow-hidden shadow-lg group bg-muted/30 backdrop-blur-sm">
        {user.bannerURL ? (
          <Image
            src={user.bannerURL}
            alt={`${user.displayName || 'User'}'s banner`}
            fill
            style={{ objectFit: 'cover' }}
            className="transition-transform duration-300 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <ImagePlus className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mb-1.5 opacity-70" />
            <p className="text-xs sm:text-sm text-center">Upload a personalized banner</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-40 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"></div>
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-card/70 backdrop-blur-sm text-card-foreground hover:bg-card/90 hover:text-primary transition-all duration-300 opacity-70 group-hover:opacity-100 transform group-hover:scale-110 rounded-full h-7 w-7 sm:h-8 sm:w-8"
          onClick={() => bannerInputRef.current?.click()}
          disabled={isUploading === 'banner'}
          aria-label={user.bannerURL ? "Change banner image" : "Upload banner image"}
        >
          {isUploading === 'banner' ? <Spinner size="small" /> : <Camera className="h-3.5 w-3.5 sm:h-4 sm:h-4" />}
        </Button>
      </div>

      <Card className="max-w-xl sm:max-w-2xl mx-auto shadow-2xl bg-card/80 backdrop-blur-md mb-6 overflow-hidden rounded-xl pt-10 sm:pt-12">
        <CardHeader className="flex flex-col items-center text-center p-4 sm:p-5">
          <div className="relative group mb-2 sm:mb-3">
            <Avatar className="h-16 w-16 sm:h-20 sm:h-24 md:h-28 md:w-28 ring-2 sm:ring-3 ring-background ring-offset-0 shadow-xl transform transition-transform group-hover:scale-110 duration-300">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                <AvatarFallback className="text-3xl sm:text-4xl md:text-5xl bg-primary/20 text-primary">
                    {getInitials(user.email, user.displayName)}
                </AvatarFallback>
            </Avatar>
            <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full bg-card/80 backdrop-blur-sm text-card-foreground hover:bg-card/95 hover:text-primary transition-all duration-300 opacity-0 group-hover:opacity-100 transform group-hover:scale-110"
                onClick={() => profilePicInputRef.current?.click()}
                disabled={isUploading === 'profile'}
                aria-label="Change profile picture"
            >
                {isUploading === 'profile' ? <Spinner size="small" /> : <Edit3 className="h-3 w-3 sm:h-3.5 sm:h-4" />}
            </Button>
          </div>

          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {user.displayName || user.email?.split('@')[0] || 'Player Profile'}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground mt-0.5">
            {user.email}
          </CardDescription>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1.5 flex items-center justify-center">
              <CalendarCheck className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5" /> Member since {memberSinceDate}
          </div>
        </CardHeader>

        <Separator className="my-3 sm:my-4 bg-border/30" />

        <CardContent className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="space-y-1.5 text-center">
            <Label className="text-sm font-semibold text-foreground flex items-center justify-center">
                <Globe className="mr-1.5 h-4 w-4 text-primary"/> Preferred Region
            </Label>
            {isAdmin ? (
              <div className="mt-1 space-y-1.5">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Your current profile region: <strong>{user.region === 'INDIA' ? 'INDIA (₹)' : 'USA ($)'}</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-1.5 justify-center">
                    <Button
                        onClick={() => handleAdminRegionChange('USA')}
                        disabled={!!targetSavingRegion || user.region === 'USA'}
                        size="sm"
                        variant={user.region === 'USA' ? 'default' : 'outline'}
                        className="flex-1 sm:flex-auto transform hover:scale-105 transition-transform text-xs h-8"
                    >
                        {targetSavingRegion === 'USA' ? <Spinner size="small" className="mr-1.5" /> : null}
                        Set My Region to USA
                    </Button>
                    <Button
                        onClick={() => handleAdminRegionChange('INDIA')}
                        disabled={!!targetSavingRegion || user.region === 'INDIA'}
                        size="sm"
                        variant={user.region === 'INDIA' ? 'default' : 'outline'}
                        className="flex-1 sm:flex-auto transform hover:scale-105 transition-transform text-xs h-8"
                    >
                        {targetSavingRegion === 'INDIA' ? <Spinner size="small" className="mr-1.5" /> : null}
                        Set My Region to INDIA
                    </Button>
                </div>
                 <p className="text-xs text-muted-foreground pt-0.5">This changes your personal profile's region setting.</p>
              </div>
            ) : (
              <p className="text-base sm:text-lg font-semibold text-foreground">
                {user.region === 'INDIA' ? 'INDIA (₹)' : user.region === 'USA' ? 'USA ($)' : user.region}
              </p>
            )}
          </div>

          <Separator className="my-3 sm:my-4 bg-border/30"/>

            <Card className="bg-muted/20 backdrop-blur-sm shadow-inner rounded-lg p-4 sm:p-5">
                <CardHeader className="pb-1.5 pt-0 px-0 text-center sm:text-left">
                    <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center justify-center sm:justify-start">
                        <Wallet className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/>My Wallet
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-3 text-center pt-3">
                     <div className="flex flex-col items-center p-2.5 sm:p-3 bg-background/40 backdrop-blur-sm rounded-lg shadow-sm border border-border/30">
                        <p className="text-xs text-muted-foreground">Winnings</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-500 dark:text-green-400 my-0.5">
                           {userCurrencySymbol}{formattedWinningsNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1.5 sm:mb-2">Available to withdraw</p>
                        <Button
                            variant="outline"
                            className="w-full text-xs py-1.5 shadow-sm hover:shadow-green-500/20 transition-all duration-300 ease-in-out rounded-lg transform hover:scale-[1.02] active:scale-100 text-green-600 dark:text-green-400 border-green-500/50 hover:bg-green-500/10 hover:border-green-500 h-8"
                            onClick={() => toast({ title: "Coming Soon!", description: "Winnings withdrawal functionality is under development."})}
                        >
                            <Download className="mr-1.5 h-3.5 w-3.5"/> Withdraw Winnings
                        </Button>
                    </div>

                    <div className="flex flex-col items-center p-2.5 sm:p-3 bg-background/40 backdrop-blur-sm rounded-lg shadow-sm border border-border/30">
                        <p className="text-xs text-muted-foreground">Credits</p>
                        <p className="text-xl sm:text-2xl font-bold text-sky-500 dark:text-sky-400 my-0.5">
                            {(user.walletBalance?.credits || 0).toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1.5 sm:mb-2">Use for entry fees</p>
                        <Button asChild variant="default" className="w-full text-xs py-1.5 shadow-md hover:shadow-primary/20 transition-all duration-300 ease-in-out rounded-lg transform hover:scale-[1.02] active:scale-100 h-8">
                          <Link href="/profile/add-credits">
                            <span className="flex items-center justify-center">
                              <CreditCard className="mr-1.5 h-3.5 w-3.5"/> Add Credits
                            </span>
                          </Link>
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="p-0 pt-4">
                     <Button asChild variant="outline" className="w-full text-sm py-2 shadow-sm hover:shadow-primary/20 transition-all duration-300 ease-in-out rounded-lg transform hover:scale-[1.03] active:scale-100 h-9">
                        <Link href="/profile/wallet">
                          <span className="flex items-center justify-center">
                            <History className="mr-2 h-4 w-4"/> View Wallet History
                          </span>
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </CardContent>
      </Card>

      <Card className="max-w-xl sm:max-w-2xl mx-auto shadow-xl bg-card/80 backdrop-blur-md hover:shadow-primary/15 hover:bg-card/70 hover:backdrop-blur-lg transition-all duration-300 overflow-hidden mt-6 rounded-xl">
        <CardHeader className="bg-muted/20 border-b border-border/30 p-4 sm:p-5">
          <CardTitle className="flex items-center text-base sm:text-xl text-foreground">
            <ListChecks className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:h-6 text-primary" /> Enrolled Tournaments ({enrolledTournaments.length})
          </CardTitle>
          <CardDescription className="text-xs">Tournaments you are currently enrolled in.</CardDescription>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4 p-4 sm:p-5 max-h-72 sm:max-h-80 overflow-y-auto">
          {isFetchingEnrollments ? (
            <div className="flex items-center justify-center h-[80px] sm:h-[120px]">
              <Spinner size="medium" />
              <p className="ml-2 sm:ml-3 text-muted-foreground text-sm">Loading your enrollments...</p>
            </div>
          ) : enrolledTournaments.length > 0 ? (
            <ul className="space-y-2.5 sm:space-y-3">
              {enrolledTournaments.map((enrollment) => (
                <li key={enrollment.id} className="p-2.5 sm:p-3 bg-muted/30 rounded-lg shadow-sm hover:bg-muted/40 hover:backdrop-blur-sm transition-colors duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-0">
                  <div className="flex-grow">
                    <h3 className="font-semibold text-foreground text-sm">{enrollment.tournamentDetails?.name || enrollment.tournamentName}</h3>
                    <p className="text-xs text-muted-foreground">
                      Game: {enrollment.tournamentDetails?.gameId || enrollment.gameId} | Enrolled on: {format(parseISO(enrollment.enrollmentDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your In-Game Name: <span className="font-medium text-foreground/80">{enrollment.inGameName}</span>
                    </p>
                  </div>
                  {enrollment.tournamentDetails && (
                    <Button variant="outline" size="sm" asChild className="transform hover:scale-105 transition-transform rounded-md w-full mt-1.5 sm:w-auto sm:mt-0 text-xs h-7 px-2">
                       <Link href={`/${enrollment.gameId}/tournaments/${enrollment.tournamentId}`}>
                        <span className="flex items-center justify-center">
                          View <Eye className="ml-1 h-3 w-3" />
                        </span>
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-[80px] sm:h-[120px] text-muted-foreground border-2 border-dashed border-muted/50 rounded-lg p-4">
              <HelpCircle className="h-8 w-8 sm:h-10 sm:h-10 mb-2 sm:mb-3 text-muted-foreground/70"/>
              <p className="text-sm sm:text-base font-medium">No enrollments yet.</p>
              <p className="text-xs text-center">Find a tournament and join the clash!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-xl sm:max-w-2xl mx-auto shadow-xl bg-card/80 backdrop-blur-md hover:shadow-primary/15 hover:bg-card/70 hover:backdrop-blur-lg transition-all duration-300 overflow-hidden mt-6 rounded-xl">
          <CardHeader className="bg-muted/20 border-b border-border/30 p-4 sm:p-5">
            <CardTitle className="flex items-center text-base sm:text-xl text-foreground">
               Performance Overview
            </CardTitle>
            <CardDescription className="text-xs">Your game statistics and performance charts will appear here soon.</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 sm:pt-4 p-4 sm:p-5">
            <div className="flex flex-col items-center justify-center h-[120px] sm:h-[150px] text-muted-foreground border-2 border-dashed border-muted/50 rounded-lg p-4">
                <Trophy className="h-8 w-8 sm:h-10 sm:h-10 mb-2 sm:mb-3 text-muted-foreground/70"/>
                <p className="text-sm sm:text-base font-medium">Player statistics are coming soon!</p>
                <p className="text-xs text-center">Check back later to see your tournament performance, winnings, and more detailed analytics.</p>
              </div>
          </CardContent>
        </Card>
      
      <div className="max-w-xl sm:max-w-2xl mx-auto mt-8 mb-4">
        <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full text-base sm:text-lg py-2.5 sm:py-3 shadow-lg hover:shadow-destructive/40 transition-all duration-300 ease-in-out rounded-lg transform hover:scale-[1.03] active:scale-100"
            >
            <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:h-5" /> Logout
        </Button>
      </div>
    </div>
  );
}

