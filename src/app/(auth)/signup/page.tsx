// src/app/(auth)/signup/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { UserPlus, User, Mail, Lock, AlertCircle, Globe } from 'lucide-react';
import type { UserRegion } from '@/data/users';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const signupSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }).max(30, { message: 'Username must be 30 characters or less' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
  region: z.enum(['INDIA', 'USA', 'OTHER'], { required_error: 'Region is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { signup, isLoggedIn, loading: authLoading, authError } = useAuth();
  const [isClientRendered, setIsClientRendered] = useState(false);

  useEffect(() => {
    setIsClientRendered(true);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      region: undefined,
    }
  });

  useEffect(() => {
    if (isClientRendered && !authLoading && isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, authLoading, router, isClientRendered]);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await signup(data.email, data.password, data.username, data.region as UserRegion); 
      toast({
        title: 'Account Created!',
        description: 'Welcome to Arena Clash! You are now logged in.',
      });
      // Redirection is now handled by the useEffect hook
    } catch (err: any) {
      const message = err.message || 'Failed to create account. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (isClientRendered && isLoggedIn && !authLoading)) { // Show spinner if auth is loading or if logged in and client rendered (to allow redirect effect to run)
     return (
        <div className="flex min-h-screen items-center justify-center">
            <Spinner size="large" />
        </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm animate-in fade-in duration-500">
      <CardHeader className="text-center">
        <UserPlus className="mx-auto h-12 w-12 text-primary mb-3" />
        <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
        <CardDescription>Join Arena Clash and start competing!</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" /> Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="YourUniqueUsername"
              {...register('username')}
              className={errors.username ? 'border-destructive' : ''}
              aria-invalid={errors.username ? "true" : "false"}
            />
            {errors.username && <p className="text-sm text-destructive flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.username.message}</p>}
          </div>

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
              placeholder="•••••••• (min. 6 characters)"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && <p className="text-sm text-destructive flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center">
              <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-destructive' : ''}
              aria-invalid={errors.confirmPassword ? "true" : "false"}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.confirmPassword.message}</p>}
          </div>

           <div className="space-y-2">
            <Label htmlFor="region" className="flex items-center">
              <Globe className="mr-2 h-4 w-4 text-muted-foreground" /> Region
            </Label>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <SelectTrigger
                    id="region"
                    className={errors.region ? 'border-destructive' : ''}
                    aria-invalid={errors.region ? "true" : "false"}
                  >
                    <SelectValue placeholder="Select your region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIA">INDIA</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    {/* <SelectItem value="OTHER">Other</SelectItem> Disabled for now */}
                    <SelectItem value="COMING_SOON" disabled>
                      MORE REGIONS COMING SOON...
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.region && <p className="text-sm text-destructive flex items-center"><AlertCircle className="mr-1 h-4 w-4" />{errors.region.message}</p>}
          </div>


          {(error || authError) && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              {error || authError}
            </div>
          )}

          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? <Spinner size="small" className="mr-2" /> : null}
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/login">Log in</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
