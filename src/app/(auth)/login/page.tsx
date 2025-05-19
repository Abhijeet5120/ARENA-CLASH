// src/app/(auth)/login/page.tsx
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
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn, loading: authLoading, authError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.push(redirectUrl); 
    }
  }, [isLoggedIn, authLoading, router, redirectUrl]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      toast({
        title: 'Login Successful!',
        description: 'Welcome back to Arena Clash!',
      });
      router.push(redirectUrl); 
    } catch (err: any) {
      const message = err.message || 'Failed to login. Please check your credentials.';
      setError(message); 
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || (isLoggedIn && !authLoading)) { 
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Spinner size="large" />
        </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm animate-in fade-in duration-500">
      <CardHeader className="text-center">
        <LogIn className="mx-auto h-12 w-12 text-primary mb-3" />
        <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
        <CardDescription>Log in to continue to Arena Clash.</CardDescription>
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
              placeholder="you@example.com"
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

          {(error || authError) && ( 
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              {error || authError}
            </div>
          )}

          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? <Spinner size="small" className="mr-2" /> : null}
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/signup">Sign up</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
