// src/app/(admin)/admin/games/new/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GameForm, type GameFormValues } from '@/components/admin/GameForm';
import { addGame, type CreateGameData } from '@/data/games';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';

export default function CreateGamePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleFormSubmit = async (data: GameFormValues) => {
    try {
      const createData: CreateGameData = {
        id: data.id,
        name: data.name,
        description: data.description,
        iconName: data.iconName, 
        imageUrl: data.imageUrl || undefined, 
        bannerImageUrl: data.bannerImageUrl || undefined,
        themeGradient: data.themeGradient || undefined,
        dataAiHint: data.dataAiHint || undefined,
      };
      
      await addGame(createData);
      toast({ title: 'Success!', description: `Game "${data.name}" created successfully.` });
      router.push('/admin/games');
    } catch (error: any) {
      console.error("Error creating game:", error);
      toast({ title: 'Error Creating Game', description: error.message || 'Failed to create game.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="outline" asChild className="transform hover:scale-105 transition-transform">
        <Link href="/admin/games">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games List
        </Link>
      </Button>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300 rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <PlusCircle className="mr-3 h-7 w-7 text-primary" />
            Create New Game
          </CardTitle>
          <CardDescription>Fill in the details to add a new game to the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <GameForm
            onSubmit={handleFormSubmit}
            onCancel={() => router.push('/admin/games')}
            isEditMode={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
