// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import React, { useMemo } from 'react';
import { Shield, UserCircle, ShieldCheck, LogOut, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';


export function Header() {
  const { user, isLoggedIn, loading, logout, isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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
  
  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }

  const formattedBalance = useMemo(() => {
    if (!user || !user.walletBalance) return 'N/A';
    const totalBalance = (user.walletBalance.winnings || 0) + (user.walletBalance.credits || 0);
    return formatCurrency(totalBalance, user.region === 'INDIA' ? 'INR' : 'USD');
  }, [user]);


  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full pt-2 sm:pt-2.5">
      <div
        className="
          container mx-auto flex h-12 sm:h-14 max-w-screen-md sm:max-w-screen-lg md:max-w-screen-xl items-center justify-between
          px-3 sm:px-4
          rounded-full
          border border-border/40
          bg-background/80
          backdrop-blur-lg
          supports-[backdrop-filter]:bg-background/60
          shadow-xl
          transition-all duration-300 ease-in-out
          hover:shadow-primary/20
        "
      >
        <Link 
          href="/" 
          className="flex items-center space-x-1.5 sm:space-x-2 text-primary hover:text-primary/80 transition-all duration-150 ease-in-out active:scale-95 transform"
        >
          <Shield className="h-5 w-5 sm:h-6 sm:h-6" />
          <span className="font-bold text-base sm:text-lg">Arena Clash</span>
        </Link>

        <nav className="flex items-center space-x-1 sm:space-x-1.5">
          {loading ? (
             <div className="h-8 w-24 sm:w-32 bg-muted/50 rounded-md animate-pulse"></div>
          ) : isLoggedIn && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button variant="ghost" asChild className="h-auto py-1 px-2 sm:py-1.5 sm:px-3 rounded-full text-sm text-foreground bg-muted/30 hover:bg-muted/50 shadow-sm transition-all duration-300 cursor-pointer backdrop-blur-sm transform hover:scale-105 hover:shadow-primary/20">
                <Link href="/profile/wallet">
                  <Wallet className="mr-1.5 h-4 w-4"/>
                  <span>{formattedBalance}</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0 transition-all duration-300 ease-in-out hover:scale-110 focus:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                      <AvatarFallback>{getInitials(user.email, user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-lg bg-popover/90 backdrop-blur-md shadow-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-md">
                    <Link href="/profile" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md">
                    <Link href="/profile/wallet" className="cursor-pointer">
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>My Wallet</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-md">
                      <Link href="/admin/dashboard" className="cursor-pointer">
                        <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-primary">Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/20 focus:text-destructive rounded-md hover:bg-destructive/15 hover:backdrop-blur-sm">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
             <div className="space-x-1 sm:space-x-1.5">
              <Button variant="ghost" asChild className="h-auto py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-lg text-sm">
                <Link href="/login">Log In</Link>
              </Button>
              <Button variant="default" asChild className="h-auto py-1.5 px-2.5 sm:py-2 sm:px-3 shadow-sm rounded-lg text-sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
