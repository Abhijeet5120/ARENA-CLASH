// src/components/game/GameCard.tsx
'use client';

import React from 'react';
import type { Game } from '@/data/games';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ImageOff } from 'lucide-react'; 

interface GameCardProps {
  game: Game;
}

const GameCardComponent = ({ game }: GameCardProps) => {
  const getInitials = React.useCallback((name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }, []);

  return (
    <Link href={`/${game.id}`} className="group block transform transition-all duration-300 hover:scale-105 focus:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-xl">
      <Card className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col bg-card/80 backdrop-blur-sm group-hover:bg-card/70 group-hover:backdrop-blur-md rounded-xl">
        <CardHeader className="p-0 relative">
          <Image
            src={game.imageUrl || `https://picsum.photos/seed/${game.id}/400/250`}
            alt={`${game.name} logo`}
            width={400}
            height={250}
            className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity duration-300"
            data-ai-hint={game.dataAiHint}
          />
          <div className={`absolute inset-0 ${game.themeGradient || 'from-transparent to-transparent'} opacity-30 group-hover:opacity-20 transition-opacity duration-300`}></div>
          <div className="absolute bottom-0 left-0 p-4 flex items-center">
            {game.iconImageUrl ? (
              <Image 
                src={game.iconImageUrl} 
                alt={`${game.name} icon`} 
                width={32} 
                height={32} 
                className="mr-3 h-8 w-8 rounded-md object-cover shadow-sm border border-primary-foreground/20"
              />
            ) : (
              <div className="mr-3 h-8 w-8 rounded-md bg-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm border border-primary-foreground/20">
                {getInitials(game.name)}
              </div>
            )}
            <CardTitle className="text-3xl font-bold text-primary-foreground drop-shadow-md">
              {game.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-grow flex flex-col justify-between">
          <p className="text-muted-foreground mb-4 text-sm">{game.description}</p>
          <Button variant="default" className="w-full mt-auto transform group-hover:scale-105 transition-transform rounded-lg"> 
            Explore Tournaments <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export const GameCard = React.memo(GameCardComponent);
