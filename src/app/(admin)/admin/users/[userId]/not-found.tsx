// src/app/(admin)/admin/users/[userId]/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserX, ArrowLeft } from 'lucide-react';

export default function UserNotFoundAdmin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <UserX className="h-24 w-24 text-destructive mb-6" /> 
      <h1 className="text-4xl font-bold text-foreground mb-3">User Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Oops! The user profile you are looking for doesn't exist or could not be found in the system.
      </p>
      <Button asChild variant="default">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users List
        </Link>
      </Button>
    </div>
  );
}
