// src/app/(admin)/admin/payments/page.tsx
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletBalancesView } from '@/components/admin/WalletBalancesView';
import { PaymentRequestsView } from '@/components/admin/PaymentRequestsView';
import { GatewaySettingsView } from '@/components/admin/GatewaySettingsView'; // New import
import { Landmark, ListChecks, Settings2 } from 'lucide-react'; // Settings2 for Gateway

export default function AdminPaymentsRootPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Landmark className="mr-3 h-8 w-8 text-primary" /> Payments & Wallets
          </h1>
          <p className="text-muted-foreground">Manage user wallets, payment requests, and gateway settings.</p>
        </div>
      </div>

      <Tabs defaultValue="payment-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 bg-card/70 backdrop-blur-sm shadow-sm rounded-lg">
          <TabsTrigger value="payment-requests" className="text-sm rounded-md">
            <ListChecks className="mr-2 h-4 w-4" /> Payment Requests
          </TabsTrigger>
          <TabsTrigger value="wallet-balances" className="text-sm rounded-md">
            <Landmark className="mr-2 h-4 w-4"/> Direct Wallet Adjustment
          </TabsTrigger>
          <TabsTrigger value="gateway-settings" className="text-sm rounded-md">
            <Settings2 className="mr-2 h-4 w-4" /> Gateway Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="payment-requests" className="mt-6">
          <PaymentRequestsView />
        </TabsContent>
        <TabsContent value="wallet-balances" className="mt-6">
          <WalletBalancesView />
        </TabsContent>
        <TabsContent value="gateway-settings" className="mt-6">
          <GatewaySettingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
