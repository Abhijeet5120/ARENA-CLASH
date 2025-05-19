// src/app/(admin)/layout.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation'; 
import React, { useEffect } from 'react'; 
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Spinner } from '@/components/ui/spinner';
import { Toaster } from '@/components/ui/toaster'; 
import { AdminProvider } from '@/context/AdminContext'; // Import AdminProvider

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); 

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push(`/admin/login?redirect=${pathname}`); 
      } else if (!isAdmin) {
        router.push('/'); 
      }
    }
  }, [loading, isLoggedIn, isAdmin, router, pathname]);

  if (loading || !isLoggedIn || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <AdminProvider> {/* Wrap with AdminProvider */}
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-64"> 
          <main className="flex-1 p-6 md:p-10 space-y-8">
            {children}
          </main>
        </div>
        <Toaster /> 
      </div>
    </AdminProvider>
  );
}
