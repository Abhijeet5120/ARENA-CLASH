import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GameNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <AlertTriangle className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-4xl font-bold text-foreground mb-3">Game Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Oops! The game you're looking for doesn't exist or couldn't be found.
      </p>
      <Button asChild variant="default">
        <Link href="/">Back to Game Selection</Link>
      </Button>
    </div>
  );
}
