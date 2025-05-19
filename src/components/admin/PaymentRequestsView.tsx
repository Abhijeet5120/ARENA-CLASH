// src/components/admin/PaymentRequestsView.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAdminContext } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, CheckCircle, XCircle, AlertTriangle, ReceiptText, Hourglass } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { PaymentRequest } from '@/data/paymentRequests';
import { getPendingPaymentRequests, approvePaymentRequest, declinePaymentRequest, getAllPaymentRequests } from '@/data/paymentRequests';
import { getAllUsers, type UserRecord } from '@/data/users'; 
import { Input } from '../ui/input';
import { format, parseISO } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface PaymentRequestWithUserDetails extends PaymentRequest {
  isProcessing?: boolean;
}

type RequestStatusFilter = 'pending' | 'approved' | 'declined' | 'all';


export function PaymentRequestsView() {
  const [requests, setRequests] = useState<PaymentRequestWithUserDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('pending');
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      let fetchedRequests;
      // Get all users to filter requests by region later
      const allUsers = await getAllUsers();
      const regionalUserIds = new Set(allUsers.filter(u => u.region === adminSelectedRegion).map(u => u.uid));

      if (statusFilter === 'all') {
        fetchedRequests = await getAllPaymentRequests();
      } else if (statusFilter === 'pending') {
        fetchedRequests = await getPendingPaymentRequests();
      } else {
        const allReqs = await getAllPaymentRequests();
        fetchedRequests = allReqs.filter(r => r.status === statusFilter);
      }
      
      // Filter requests by user's region
      const regionalRequests = fetchedRequests.filter(req => regionalUserIds.has(req.userId));

      regionalRequests.sort((a, b) => {
        const dateA = a.status === 'pending' ? a.requestedDate : (a.processedDate || a.requestedDate);
        const dateB = b.status === 'pending' ? b.requestedDate : (b.processedDate || b.requestedDate);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      setRequests(regionalRequests.map(r => ({ ...r, isProcessing: false })));
    } catch (error) {
      console.error("Failed to load payment requests:", error);
      toast({ title: 'Error', description: 'Failed to load payment requests.', variant: 'destructive' });
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, statusFilter, adminSelectedRegion]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);
  
  const handleApprove = async (requestId: string, userId: string, amount: number) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isProcessing: true } : r));
    try {
      await approvePaymentRequest(requestId, userId, amount);
      toast({ title: 'Success', description: 'Payment request approved and credits added.' });
      loadRequests(); 
    } catch (error: any) {
      toast({ title: 'Error Approving', description: error.message || 'Failed to approve request.', variant: 'destructive' });
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isProcessing: false } : r));
    }
  };

  const handleDecline = async (requestId: string) => {
     setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isProcessing: true } : r));
    try {
      await declinePaymentRequest(requestId);
      toast({ title: 'Declined', description: 'Payment request has been declined.' });
      loadRequests(); 
    } catch (error: any) {
      toast({ title: 'Error Declining', description: error.message || 'Failed to decline request.', variant: 'destructive' });
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, isProcessing: false } : r));
    }
  };
  
  const filteredRequests = requests.filter(req =>
    (req.userEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (req.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (req.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) 
  );
  
  const formatDate = (dateString?: string | number) => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return format(date, 'MMM d, yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-primary/15 transition-shadow duration-300 rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><ReceiptText className="mr-3 h-6 w-6 text-primary"/>Manage Payment Requests ({adminSelectedRegion})</CardTitle>
        <CardDescription>Review payment requests to add credits to user wallets for the {adminSelectedRegion} region.</CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                    type="search"
                    placeholder="Search by user or transaction ID..."
                    className="w-full pl-10 shadow-sm bg-background/70 backdrop-blur-sm rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatusFilter)} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="declined">Declined</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>


        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Spinner size="large" />
            <p className="ml-4 text-muted-foreground">Loading payment requests for {adminSelectedRegion}...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID (Transaction ID)</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead className="text-right">Amount (Credits)</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{req.id.substring(req.id.length - 6)}</Badge></TableCell>
                    <TableCell>{req.userEmail}</TableCell>
                    <TableCell className="text-right font-medium">{req.amount}</TableCell>
                    <TableCell>{formatDate(req.requestedDate)}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={
                          req.status === 'pending' ? 'default' : 
                          req.status === 'approved' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                            req.status === 'pending' ? 'bg-amber-500/80 hover:bg-amber-500/70 text-white' : 
                            req.status === 'approved' ? 'bg-green-600/80 hover:bg-green-600/70 text-white' :
                            req.status === 'declined' ? 'bg-red-600/80 hover:bg-red-600/70 text-white' : ''
                        }
                      >
                        {req.status === 'pending' && <Hourglass className="mr-1 h-3 w-3"/>}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {req.status === 'pending' && (
                        <div className="flex justify-center gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white transform hover:scale-105 transition-transform"
                            onClick={() => handleApprove(req.id, req.userId, req.amount)}
                            disabled={req.isProcessing}
                          >
                            {req.isProcessing ? <Spinner size="small"/> : <CheckCircle className="mr-1.5 h-4 w-4" />} Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="transform hover:scale-105 transition-transform"
                            onClick={() => handleDecline(req.id)}
                            disabled={req.isProcessing}
                          >
                            {req.isProcessing ? <Spinner size="small"/> : <XCircle className="mr-1.5 h-4 w-4" />} Decline
                          </Button>
                        </div>
                      )}
                       {(req.status === 'approved' || req.status === 'declined') && req.processedDate && (
                        <span className="text-xs text-muted-foreground">Processed: {formatDate(req.processedDate)}</span>
                       )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center py-6">
                        <AlertTriangle className="h-10 w-10 text-muted-foreground/50 mb-3"/>
                        {searchTerm ? `No requests found matching "${searchTerm}".` : `No ${statusFilter} payment requests for ${adminSelectedRegion}.`}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
         {filteredRequests.length > 0 && (
          <p className="text-sm text-muted-foreground text-center pt-4">
            Showing {filteredRequests.length} of {requests.length} total {statusFilter} requests for {adminSelectedRegion}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
