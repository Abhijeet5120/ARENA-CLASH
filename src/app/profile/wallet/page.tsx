// src/app/profile/wallet/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { getTransactionsByUserId, type Transaction } from '@/data/transactions';
import { getPaymentRequestsByUserId, type PaymentRequest } from '@/data/paymentRequests'; 
import { format, parseISO } from 'date-fns';
import { ArrowLeft, CreditCard, Download, History, DollarSign, Banknote, Hourglass, CheckCircle, XCircle, ReceiptText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

export default function WalletPage() {
  const { user, loading, isLoggedIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userPaymentRequests, setUserPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push('/login?redirect=/profile/wallet');
    }
  }, [loading, isLoggedIn, router]);

  const fetchWalletData = useCallback(async () => {
    if (user && isLoggedIn) {
      setIsFetchingData(true);
      try {
        const [userTransactions, paymentReqs] = await Promise.all([
          getTransactionsByUserId(user.uid),
          getPaymentRequestsByUserId(user.uid)
        ]);
        
        setTransactions(userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setUserPaymentRequests(paymentReqs.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()));

      } catch (error) {
        console.error("Failed to fetch wallet data:", error);
        toast({
          title: "Error",
          description: "Could not load your wallet history.",
          variant: "destructive"
        });
      } finally {
        setIsFetchingData(false);
      }
    }
  }, [user, isLoggedIn, toast]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  if (loading || !isLoggedIn || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
      </div>
    );
  }
  
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'credit_purchase': return <CreditCard className="text-green-500 h-5 w-5 sm:h-6 sm:w-6" />;
      case 'tournament_entry': return <Banknote className="text-red-500 h-5 w-5 sm:h-6 sm:w-6" />;
      case 'winnings_payout': return <Download className="text-blue-500 h-5 w-5 sm:h-6 sm:w-6" />;
      case 'admin_credit_adjustment': return <DollarSign className="text-purple-500 h-5 w-5 sm:h-6 sm:w-6" />; 
      case 'admin_winnings_adjustment': return <DollarSign className="text-purple-500 h-5 w-5 sm:h-6 sm:w-6" />; 
      default: return <History className="h-5 w-5 sm:h-6 sm:w-6"/>;
    }
  };
  
  const getPaymentRequestStatusIcon = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'pending': return <Hourglass className="text-amber-500 h-5 w-5 sm:h-6 sm:w-6" />;
      case 'approved': return <CheckCircle className="text-green-500 h-5 w-5 sm:h-6 sm:w-6" />;
      case 'declined': return <XCircle className="text-red-500 h-5 w-5 sm:h-6 sm:w-6" />;
      default: return <ReceiptText className="h-5 w-5 sm:h-6 sm:w-6"/>;
    }
  };

  const MainWalletSymbol = user?.region === 'INDIA' ? (
    <span className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-primary mb-3 sm:mb-4 flex items-center justify-center text-4xl sm:text-5xl font-semibold">₹</span>
  ) : (
    <DollarSign className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-primary mb-3 sm:mb-4" />
  );

  const WinningsSymbol = user?.region === 'INDIA' ? (
    <span className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center text-md sm:text-lg font-semibold">₹</span>
  ) : (
    <DollarSign className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6"/>
  );


  return (
    <div className="container mx-auto py-8 max-w-2xl sm:max-w-3xl animate-in fade-in duration-500 px-4">
      <Button variant="outline" onClick={() => router.push('/profile')} className="mb-6 transform hover:scale-105 transition-transform text-sm sm:text-base">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
      </Button>

      <Card className="shadow-2xl bg-card/80 backdrop-blur-sm mb-6 sm:mb-8 rounded-xl">
        <CardHeader className="text-center p-4 sm:p-6">
          {MainWalletSymbol}
          <CardTitle className="text-3xl sm:text-4xl font-bold">My Wallet</CardTitle>
          <CardDescription className="text-sm sm:text-base">Manage your funds and view your transaction history.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
          <Card className="bg-muted/30 backdrop-blur-sm shadow-md rounded-lg p-4 sm:p-6 transform hover:scale-105 transition-transform">
            <CardTitle className="text-lg sm:text-xl mb-1 sm:mb-2 text-green-600 dark:text-green-400 flex items-center">
              {WinningsSymbol} Winnings Balance
            </CardTitle>
            <p className="text-3xl sm:text-4xl font-bold text-foreground">{formatCurrency(user.walletBalance?.winnings || 0, user.region)}</p>
            <p className="text-xs text-muted-foreground mt-1">Available for withdrawal.</p>
          </Card>
          <Card className="bg-muted/30 backdrop-blur-sm shadow-md rounded-lg p-4 sm:p-6 transform hover:scale-105 transition-transform">
            <CardTitle className="text-lg sm:text-xl mb-1 sm:mb-2 text-sky-600 dark:text-sky-400 flex items-center">
              <CreditCard className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:h-6"/> Credits Balance
            </CardTitle>
            <p className="text-3xl sm:text-4xl font-bold text-foreground">{(user.walletBalance?.credits || 0).toFixed(0)}</p> {/* Credits as plain number */}
            <p className="text-xs text-muted-foreground mt-1">Use for tournament entries.</p>
          </Card>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-6 border-t">
          <Button asChild className="w-full sm:flex-1 text-sm sm:text-lg py-2.5 sm:py-3 transform hover:scale-105 transition-transform">
            <Link href="/profile/add-credits">
              <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:h-5" /> Add Credits
            </Link>
          </Button>
          <Button variant="outline" className="w-full sm:flex-1 text-sm sm:text-lg py-2.5 sm:py-3 transform hover:scale-105 transition-transform" disabled>
            <Download className="mr-2 h-4 w-4 sm:h-5 sm:h-5" /> Withdraw Winnings (Soon)
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-xl bg-card/80 backdrop-blur-sm rounded-xl mb-6 sm:mb-8">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl flex items-center">
            <ReceiptText className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:h-7 text-primary" /> Credit Purchase Requests
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Status of your submitted credit purchase requests.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isFetchingData && userPaymentRequests.length === 0 ? ( 
            <div className="flex items-center justify-center h-32 sm:h-40">
              <Spinner size="medium" />
              <p className="ml-2 sm:ml-3 text-muted-foreground text-sm sm:text-base">Loading payment requests...</p>
            </div>
          ) : userPaymentRequests.length > 0 ? (
            <ul className="space-y-3 sm:space-y-4">
              {userPaymentRequests.map((req) => (
                <li key={req.id} className="p-3 sm:p-4 bg-muted/30 rounded-lg shadow-sm hover:bg-muted/40 hover:backdrop-blur-sm transition-colors duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center w-full sm:w-auto">
                     <div className="mr-3 sm:mr-4 p-1.5 sm:p-2 bg-background/50 rounded-full shadow-inner">
                        {getPaymentRequestStatusIcon(req.status)}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground text-sm sm:text-base">Request for {formatCurrency(req.amount, user.region)} Credits</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">Tx ID: <Badge variant="secondary" className="font-mono text-xs">{req.id}</Badge></p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">
                        Req: {format(parseISO(req.requestedDate), 'MMM d, yy, HH:mm')}
                        {req.processedDate && ` | Proc: ${format(parseISO(req.processedDate), 'MMM d, yy, HH:mm')}`}
                      </p>
                    </div>
                  </div>
                   <Badge 
                        variant={
                          req.status === 'pending' ? 'default' : 
                          req.status === 'approved' ? 'secondary' : 
                          'destructive'
                        }
                        className={`text-xs sm:text-sm mt-2 sm:mt-0 self-start sm:self-center ${
                            req.status === 'pending' ? 'bg-amber-500/80 hover:bg-amber-500/70 text-white' : 
                            req.status === 'approved' ? 'bg-green-600/80 hover:bg-green-600/70 text-white' :
                            req.status === 'declined' ? 'bg-red-600/80 hover:bg-red-600/70 text-white' : ''
                        }`}
                      >
                        {req.status === 'pending' && <Hourglass className="mr-1 h-3 w-3"/>}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 sm:py-10 text-muted-foreground border-2 border-dashed border-muted/50 rounded-lg">
              <ReceiptText className="mx-auto h-10 w-10 sm:h-12 sm:h-12 mb-3 sm:mb-4 text-muted-foreground/50"/>
              <p className="text-md sm:text-lg">No credit purchase requests found.</p>
              <p className="text-xs sm:text-sm">Your submitted requests will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>


      <Card className="shadow-xl bg-card/80 backdrop-blur-sm rounded-xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl flex items-center">
            <History className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:h-7 text-primary" /> Transaction History
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your recent wallet activity (excluding pending requests).</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isFetchingData && transactions.length === 0 ? ( 
            <div className="flex items-center justify-center h-32 sm:h-40">
              <Spinner size="medium" />
              <p className="ml-2 sm:ml-3 text-muted-foreground text-sm sm:text-base">Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <ul className="space-y-3 sm:space-y-4">
              {transactions.map((tx) => (
                <li key={tx.id} className="p-3 sm:p-4 bg-muted/30 rounded-lg shadow-sm hover:bg-muted/40 hover:backdrop-blur-sm transition-colors duration-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 sm:mr-4 p-1.5 sm:p-2 bg-background/50 rounded-full shadow-inner">
                        {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground capitalize text-sm sm:text-base">{tx.type.replace(/_/g, ' ')}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-xs md:max-w-sm" title={tx.description}>{tx.description}</p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">{format(parseISO(tx.date), 'MMM d, yyyy, HH:mm')}</p>
                    </div>
                  </div>
                  <p className={`text-md sm:text-lg font-semibold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.amount >= 0 ? '+' : ''}
                    {tx.currency === 'credits' ? `${tx.amount.toFixed(0)} C` : formatCurrency(tx.amount, user.region)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 sm:py-10 text-muted-foreground border-2 border-dashed border-muted/50 rounded-lg">
              <History className="mx-auto h-10 w-10 sm:h-12 sm:h-12 mb-3 sm:mb-4 text-muted-foreground/50"/>
              <p className="text-md sm:text-lg">No transactions yet.</p>
              <p className="text-xs sm:text-sm">Your wallet activity will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
