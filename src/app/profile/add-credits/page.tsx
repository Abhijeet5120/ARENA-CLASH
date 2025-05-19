// src/app/profile/add-credits/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';
import Link from 'next/link';
import { getQRCodeForAmount, type QRCodeMapping } from '@/data/qrCodeMappings';
import { createPaymentRequest, type CreatePaymentRequestData } from '@/data/paymentRequests';
import { ArrowLeft, QrCode, AlertCircle, CheckCircle, ReceiptText } from 'lucide-react';

const creditOptions = [
    { amount: 50, label: "50 Credits" },
    { amount: 100, label: "100 Credits" },
    { amount: 150, label: "150 Credits" },
];

const MIN_TRANSACTION_ID_LENGTH = 12;

export default function AddCreditsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [currentQR, setCurrentQR] = useState<QRCodeMapping | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/profile/add-credits');
    }
  }, [authLoading, isLoggedIn, router]);

  const handleAmountSelect = useCallback(async (amount: number) => {
    setSelectedAmount(amount);
    setCurrentQR(null);
    setIsLoadingQR(true);
    setPageError(null);
    setRequestSubmitted(false); 
    setTransactionId(''); 
    try {
      const qrMapping = await getQRCodeForAmount(amount);
      if (qrMapping) {
        setCurrentQR(qrMapping);
      } else {
        setPageError(`QR code for ${amount} credits is not available at the moment. Please contact support.`);
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
      setPageError("Failed to load QR code. Please try again.");
    } finally {
      setIsLoadingQR(false);
    }
  }, []);

  const handleSubmitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !selectedAmount || !transactionId.trim() || transactionId.trim().length < MIN_TRANSACTION_ID_LENGTH) {
      setPageError(`Please select an amount and enter a valid transaction ID of at least ${MIN_TRANSACTION_ID_LENGTH} characters.`);
      return;
    }
    setIsSubmitting(true);
    setPageError(null);

    try {
      const requestData: CreatePaymentRequestData = {
        userId: user.uid,
        userEmail: user.email!,
        amount: selectedAmount,
        transactionId: transactionId.trim(),
      };
      const newRequest = await createPaymentRequest(requestData);
      if (newRequest) {
        toast({
          title: 'Payment Request Submitted!',
          description: `Your request for ${selectedAmount} credits with Transaction ID: ${transactionId.trim()} has been submitted for verification.`,
          variant: 'default',
          duration: 7000,
        });
        setRequestSubmitted(true);
        // setTransactionId(''); // Keep transaction ID for display in success message if needed, or clear as before.
      } else {
        throw new Error('Failed to submit payment request. Please try again.');
      }
    } catch (error: any) {
      console.error('Error submitting payment request:', error);
      if (error.message && error.message.toLowerCase().includes("transaction id") && error.message.toLowerCase().includes("already been submitted")) {
        setPageError(error.message); 
      } else {
        setPageError(error.message || 'An unexpected error occurred while submitting your request.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size="large" />
      </div>
    );
  }
  
  const isSubmitDisabled = 
    isSubmitting || 
    isLoadingQR || 
    !currentQR || 
    !transactionId.trim() || 
    transactionId.trim().length < MIN_TRANSACTION_ID_LENGTH ||
    requestSubmitted;

  return (
    <div className="container mx-auto py-6 sm:py-8 max-w-md sm:max-w-lg px-4">
      <Button variant="outline" onClick={() => router.push('/profile')} className="mb-4 sm:mb-6 transform hover:scale-105 transition-transform text-xs sm:text-sm">
        <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to Profile
      </Button>

      <Card className="shadow-2xl bg-card/80 backdrop-blur-sm animate-in fade-in duration-500 rounded-xl">
        <CardHeader className="text-center p-4 sm:p-6">
          <QrCode className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2" />
          <CardTitle className="text-xl sm:text-2xl font-bold">Add Credits to Your Wallet</CardTitle>
          <CardDescription className="text-xs sm:text-sm pt-1">
            Select amount, scan QR to pay, then enter transaction ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div>
            <Label className="text-sm sm:text-base font-semibold mb-2 block text-center">1. Select Credit Amount:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {creditOptions.map(option => (
                <Button
                  key={option.amount}
                  variant={selectedAmount === option.amount ? "default" : "outline"}
                  onClick={() => handleAmountSelect(option.amount)}
                  className="text-xs sm:text-sm py-2.5 sm:py-3 transform hover:scale-105 transition-transform rounded-lg shadow-sm"
                  disabled={isLoadingQR && selectedAmount === option.amount}
                >
                  {isLoadingQR && selectedAmount === option.amount ? <Spinner size="small"/> : option.label}
                </Button>
              ))}
            </div>
          </div>

          {selectedAmount && (
            <div className="animate-in fade-in duration-300 space-y-3 sm:space-y-4">
              <hr className="border-border/50"/>
              <div className="text-center space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-semibold block">2. Scan & Pay ({selectedAmount} Credits):</Label>
                {isLoadingQR && (
                  <div className="flex flex-col items-center justify-center h-40 sm:h-48 bg-muted/30 rounded-lg">
                    <Spinner size="medium" />
                    <p className="mt-2 text-muted-foreground text-xs sm:text-sm">Loading QR Code...</p>
                  </div>
                )}
                {!isLoadingQR && currentQR && (
                  <div className="flex flex-col items-center">
                    <div className="p-1.5 sm:p-2 bg-background rounded-lg shadow-inner inline-block border border-border/50">
                        <Image 
                            src={currentQR.qrCodeDataUri} 
                            alt={`QR Code for ${selectedAmount} Credits`} 
                            width={180} 
                            height={180}
                            className="rounded sm:w-[200px] sm:h-[200px]"
                            data-ai-hint={`payment qr code ${selectedAmount}`}
                        />
                    </div>
                    {currentQR.description && <p className="text-xs text-muted-foreground mt-1.5">{currentQR.description}</p>}
                  </div>
                )}
                {!isLoadingQR && !currentQR && pageError && !pageError.toLowerCase().includes("transaction id") && ( 
                    <div className="p-2 sm:p-3 bg-destructive/10 text-destructive rounded-md flex items-center justify-center text-xs sm:text-sm">
                        <AlertCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:h-4"/> {pageError}
                    </div>
                )}
              </div>

              {currentQR && (!pageError || pageError.toLowerCase().includes("transaction id")) && ( 
                <>
                 <hr className="border-border/50"/>
                  <form onSubmit={handleSubmitRequest} className="space-y-2.5 sm:space-y-3">
                    <div>
                      <Label htmlFor="transactionId" className="text-sm sm:text-base font-semibold mb-1.5 block text-center">3. Enter Transaction ID:</Label>
                      <Input
                        id="transactionId"
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder={`e.g., UPI0012345678 (min ${MIN_TRANSACTION_ID_LENGTH} chars)`}
                        className="text-xs sm:text-sm p-2 sm:p-2.5 text-center focus:ring-primary/50"
                        required
                        disabled={isSubmitting || requestSubmitted}
                        minLength={MIN_TRANSACTION_ID_LENGTH}
                      />
                      <p className="text-xs text-muted-foreground text-center mt-1">Enter the reference ID from your payment app.</p>
                      {transactionId.trim().length > 0 && transactionId.trim().length < MIN_TRANSACTION_ID_LENGTH && (
                        <p className="text-xs text-destructive text-center mt-1">
                            Transaction ID must be at least {MIN_TRANSACTION_ID_LENGTH} characters.
                        </p>
                      )}
                    </div>
                     {pageError && ( 
                        <div className="text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md flex items-center justify-center text-center">
                            <AlertTriangle className="mr-1.5 h-4 w-4 flex-shrink-0" />
                            {pageError}
                        </div>
                    )}

                    {requestSubmitted ? (
                        <div className="p-2.5 sm:p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md flex items-center justify-center text-center flex-col gap-1.5 sm:gap-2">
                            <CheckCircle className="h-5 w-5 sm:h-6 sm:h-6" />
                            <p className="font-semibold text-xs sm:text-sm">Request Submitted Successfully!</p>
                            <p className="text-xs">Your credits will be added once verified.</p>
                            <Button variant="outline" onClick={() => {setSelectedAmount(null); setCurrentQR(null); setRequestSubmitted(false); setTransactionId(''); setPageError(null);}} className="mt-1.5 text-xs h-8 px-3">
                                Add More Credits
                            </Button>
                        </div>
                    ) : (
                        <Button 
                            type="submit" 
                            className="w-full text-sm sm:text-base py-2.5 sm:py-3 transform hover:scale-105 transition-transform rounded-lg" 
                            disabled={isSubmitDisabled}
                        >
                            {isSubmitting ? <Spinner size="small" className="mr-1.5" /> : <ReceiptText className="mr-1.5 h-4 w-4" />}
                            {isSubmitting ? 'Submitting...' : 'Submit Payment Request'}
                        </Button>
                    )}
                  </form>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
