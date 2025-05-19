// src/components/admin/WalletBalancesView.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, updateUser, type UserRecord } from '@/data/users';
import { useToast } from '@/hooks/use-toast';
import { useAdminContext } from '@/context/AdminContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, Save, AlertCircle, ShieldCheck, WalletCards } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface EditableUserRecord extends UserRecord {
  editableWinnings: string;
  editableCredits: string;
  isSaving?: boolean;
  error?: string | null;
}

export function WalletBalancesView() {
  const [users, setUsers] = useState<EditableUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { adminSelectedRegion } = useAdminContext();

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUsers(adminSelectedRegion); // Filter by adminSelectedRegion
      setUsers(fetchedUsers.map(u => ({
        ...u,
        editableWinnings: (u.walletBalance?.winnings || 0).toString(),
        editableCredits: (u.walletBalance?.credits || 0).toString(),
        isSaving: false,
        error: null,
      })));
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({ title: 'Error', description: 'Failed to load users.', variant: 'destructive' });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, adminSelectedRegion]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleBalanceChange = (userId: string, field: 'editableWinnings' | 'editableCredits', value: string) => {
    setUsers(prevUsers => prevUsers.map(u => 
      u.uid === userId ? { ...u, [field]: value, error: null } : u
    ));
  };

  const handleSaveChanges = async (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.uid === userId ? { ...u, isSaving: true, error: null } : u));
    
    const userToUpdate = users.find(u => u.uid === userId);
    if (!userToUpdate) {
      toast({ title: 'Error', description: 'User not found for update.', variant: 'destructive' });
      setUsers(prevUsers => prevUsers.map(u => u.uid === userId ? { ...u, isSaving: false } : u));
      return;
    }

    const newWinnings = parseFloat(userToUpdate.editableWinnings);
    const newCredits = parseFloat(userToUpdate.editableCredits);

    if (isNaN(newWinnings) || newWinnings < 0 || isNaN(newCredits) || newCredits < 0) {
      setUsers(prevUsers => prevUsers.map(u => u.uid === userId ? { ...u, isSaving: false, error: "Invalid balance. Must be non-negative." } : u));
      return;
    }

    try {
      const updatedUser = await updateUser(userId, { 
        walletBalance: { 
          winnings: newWinnings, 
          credits: newCredits 
        } 
      });
      if (updatedUser) {
        toast({ title: 'Success', description: `${userToUpdate.displayName || userToUpdate.email}'s wallet updated.` });
        setUsers(prevUsers => prevUsers.map(u => 
          u.uid === userId ? { 
            ...u, 
            ...updatedUser,
            editableWinnings: (updatedUser.walletBalance?.winnings || 0).toString(),
            editableCredits: (updatedUser.walletBalance?.credits || 0).toString(),
            isSaving: false,
            error: null,
          } : u
        ));
      } else {
        throw new Error('Failed to update user wallet on the server.');
      }
    } catch (error: any) {
      console.error("Error updating wallet:", error);
      toast({ title: 'Error', description: error.message || 'Failed to update wallet.', variant: 'destructive' });
      setUsers(prevUsers => prevUsers.map(u => u.uid === userId ? { ...u, isSaving: false, error: error.message || 'Failed to update.' } : u));
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-primary/15 transition-shadow duration-300 rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><WalletCards className="mr-3 h-6 w-6 text-primary"/>Direct Wallet Adjustment ({adminSelectedRegion})</CardTitle>
        <CardDescription>View and directly edit user Winnings and Credits balances for the {adminSelectedRegion} region. Use with caution.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
          <Input
            type="search"
            placeholder="Search users by email, display name, or UID..."
            className="w-full pl-10 shadow-sm bg-background/70 backdrop-blur-sm rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Spinner size="large" />
            <p className="ml-4 text-muted-foreground">Loading user wallet data for {adminSelectedRegion}...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Avatar</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead className="w-[150px]">Winnings ({adminSelectedRegion === 'INDIA' ? '₹' : '$'})</TableHead>
                  <TableHead className="w-[150px]">Credits</TableHead>
                  <TableHead className="w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <TableRow key={user.uid} className="hover:bg-muted/30 transition-colors duration-150">
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                        <AvatarFallback>
                          {getInitials(user.email, user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.displayName || <span className="italic text-muted-foreground">N/A</span>}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      {user.email.toLowerCase() === 'admin@example.com' && (
                          <Badge variant="default" className="mt-1 bg-primary/80 text-primary-foreground text-xs">
                              <ShieldCheck className="mr-1 h-3 w-3" /> Admin
                          </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{user.uid}</Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={user.editableWinnings}
                        onChange={(e) => handleBalanceChange(user.uid, 'editableWinnings', e.target.value)}
                        className="h-9 text-sm disabled:opacity-70"
                        placeholder="0.00"
                        step="0.01"
                        disabled={user.isSaving}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={user.editableCredits}
                        onChange={(e) => handleBalanceChange(user.uid, 'editableCredits', e.target.value)}
                        className="h-9 text-sm disabled:opacity-70"
                        placeholder="0"
                        step="1"
                        disabled={user.isSaving}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveChanges(user.uid)} 
                        disabled={user.isSaving || 
                          (user.walletBalance && parseFloat(user.editableWinnings) === (user.walletBalance.winnings || 0) && parseFloat(user.editableCredits) === (user.walletBalance.credits || 0))
                        }
                        className="transform hover:scale-105 transition-transform rounded-lg"
                      >
                        {user.isSaving ? <Spinner size="small" className="mr-1.5"/> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                        {user.isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      {user.error && (
                          <p className="text-xs text-destructive mt-1 flex items-center justify-center">
                              <AlertCircle className="mr-1 h-3 w-3 shrink-0" /> {user.error}
                          </p>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? `No users found matching "${searchTerm}" in ${adminSelectedRegion}.` : `No users found in ${adminSelectedRegion}.`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {filteredUsers.length > 0 && (
          <p className="text-sm text-muted-foreground text-center pt-4">
            Showing {filteredUsers.length} of {users.length} total users in {adminSelectedRegion}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
