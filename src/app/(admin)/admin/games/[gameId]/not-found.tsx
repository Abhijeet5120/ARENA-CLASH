// src/app/(admin)/admin/games/[gameId]/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, ArrowLeft } from 'lucide-react';

export default function GameDetailsNotFoundAdmin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <Gamepad2 className="h-24 w-24 text-destructive mb-6" /> 
      <h1 className="text-4xl font-bold text-foreground mb-3">Game Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Oops! The game you are trying to manage doesn't exist or could not be found.
      </p>
      <Button asChild variant="default">
        <Link href="/admin/games">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Games List
        </Link>
      </Button>
    </div>
  );
}
