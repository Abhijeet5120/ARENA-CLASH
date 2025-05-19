// src/app/(admin)/admin/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, type UserRecord } from '@/data/users';
import { useToast } from '@/hooks/use-toast';
import { useAdminContext } from '@/context/AdminContext'; 
import { Input } from '@/components/ui/input';
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
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Search, ShieldCheck, Eye } from 'lucide-react';


export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const { adminSelectedRegion } = useAdminContext();

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUsers(adminSelectedRegion); // Filter by adminSelectedRegion
      setUsers(fetchedUsers);
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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      console.warn("Error formatting date:", timestamp, e);
      return "Invalid Date";
    }
  };

  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleUserRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" /> Manage Users ({adminSelectedRegion})
          </h1>
          <p className="text-muted-foreground">View and manage registered users in the {adminSelectedRegion} region.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        <Input
          type="search"
          placeholder="Search users by email, display name, or UID..."
          className="w-full pl-10 shadow-sm bg-background/70 backdrop-blur-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Spinner size="large" />
          <p className="ml-4 text-muted-foreground">Loading users for {adminSelectedRegion}...</p>
        </div>
      ) : (
        <div className="bg-card/80 backdrop-blur-sm shadow-xl rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow 
                  key={user.uid} 
                  className="hover:bg-muted/40 hover:backdrop-blur-sm cursor-pointer transition-colors duration-150"
                  onClick={() => handleUserRowClick(user.uid)}
                >
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                       <AvatarFallback>
                        {getInitials(user.email, user.displayName)}
                       </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.displayName || <span className="italic text-muted-foreground">N/A</span>}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{user.uid}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.email.toLowerCase() === 'admin@example.com' ? (
                      <Badge variant="default" className="bg-primary/80 text-primary-foreground">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-center">
                     <Button variant="ghost" size="icon" aria-label="View user profile" onClick={(e) => { e.stopPropagation(); handleUserRowClick(user.uid);}} className="hover:text-primary transition-colors">
                        <Eye className="h-4 w-4" />
                      </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No users found for {adminSelectedRegion}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
       {filteredUsers.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredUsers.length} of {users.length} total users in {adminSelectedRegion}.
        </p>
      )}
    </div>
  );
}
