// src/app/(main)/layout.tsx
'use client'; // Required because we are using hooks from AuthContext

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RegionSelectionModal } from '@/components/layout/RegionSelectionModal';
import { useAuth } from '@/context/AuthContext';
import type React from 'react';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, promptRegionSelection, isAdmin } = useAuth();

  // Determine if the modal should be open.
  // It should open if:
  // 1. The user is logged in (user object exists).
  // 2. The user is NOT an admin.
  // 3. The AuthContext state `promptRegionSelection` is true (meaning their region is not 'INDIA' or 'USA').
  const shouldOpenModal = !!user && !isAdmin && promptRegionSelection;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8">
        {children}
      </main>
      <Footer />
      {shouldOpenModal && (
        <RegionSelectionModal isOpen={shouldOpenModal} />
      )}
    </div>
  );
}
