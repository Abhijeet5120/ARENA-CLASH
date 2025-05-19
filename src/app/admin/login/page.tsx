// src/app/admin/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { ShieldAlert, Mail, Lock, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn, isAdmin, loading: authLoading, authError } = useAuth();
  const [isClientRendered, setIsClientRendered] = useState(false);

  useEffect(() => {
    setIsClientRendered(true);
  }, []);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const redirectUrlFromParams = searchParams.get('redirect') || '/admin/dashboard';

  useEffect(() => {
    if (isClientRendered && !authLoading && isLoggedIn && isAdmin) {
      router.push(redirectUrlFromParams);
    }
  }, [isLoggedIn, isAdmin, authLoading, router, redirectUrlFromParams, isClientRendered]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const loggedInUser = await login(data.email, data.password); 
      
      if (loggedInUser && loggedInUser.email?.toLowerCase() === 'admin@example.com') {
         toast({
          title: 'Admin Login Successful!',
          description: 'Welcome to the Admin Panel.',
        });
        router.push(redirectUrlFromParams); 
      } else if (loggedInUser) { 
         toast({
          title: 'Access Denied',
          description: 'You do not have administrative privileges.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      if (!authError) { 
        toast({
          title: "Login Failed",
          description: err.message || "An error occurred during login.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading && isClientRendered) { 
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-background to-muted/70 p-4">
            <Spinner size="large" />
        </div>
    ); 
  }
  

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-background to-muted/70 p-4">
        <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm animate-in fade-in duration-500">
        <CardHeader className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-3xl font-bold">Admin Login</CardTitle>
            <CardDescription>Access the Arena Clash Admin Panel.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
                </Label>
                <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
                aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && <p className="text-sm text-destructive flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center">
                <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Password
                </Label>
                <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
                aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && <p className="text-sm text-destructive flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.password.message}</p>}
            </div>

            {authError && ( 
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                {authError}
                </div>
            )}

            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
                {isLoading ? <Spinner size="small" className="mr-2"/> : null}
                {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
            </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
            Accessing user site?{' '}
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/login">User Login</Link>
            </Button>
            </p>
             <p className="text-xs text-muted-foreground text-center">
              Default admin: admin@example.com / password
            </p>
        </CardFooter>
        </Card>
    </div>
  );
}
