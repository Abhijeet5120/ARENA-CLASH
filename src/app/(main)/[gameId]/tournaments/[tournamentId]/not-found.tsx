// src/app/(main)/[gameId]/tournaments/[tournamentId]/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function TournamentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <SearchX className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-4xl font-bold text-foreground mb-3">Tournament Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Oops! The tournament you are looking for doesn't exist, has been moved, or is no longer available.
      </p>
      <div className="flex space-x-4">
        <Button asChild variant="default">
          <Link href="/">
             <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Game Selection
          </Link>
        </Button>
        {/* Optional: Add a button to go back to the specific game page if gameId is accessible here,
            otherwise, a general link to home or game selection is safest.
            For now, keeping it simple.
        */}
      </div>
    </div>
  );
}
