// src/components/layout/RegionSelectionModal.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { UserRegion } from '@/data/users';
import { Globe } from 'lucide-react';

interface RegionSelectionModalProps {
  isOpen: boolean;
  // onClose is implicitly handled by AuthContext's completeRegionSelection
}

export function RegionSelectionModal({ isOpen }: RegionSelectionModalProps) {
  const { user, updateUserProfile, completeRegionSelection } = useAuth();
  const { toast } = useToast();
  const [selectedRegion, setSelectedRegion] = useState<UserRegion | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveRegion = async () => {
    if (!selectedRegion || !user) {
      toast({
        title: 'Error',
        description: 'Please select a region.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await updateUserProfile({ region: selectedRegion });
      if (updatedUser) {
        toast({
          title: 'Region Saved',
          description: `Your preferred region has been set to ${selectedRegion}.`,
        });
        completeRegionSelection(); // This will set promptRegionSelection to false in AuthContext
      } else {
        throw new Error('Failed to save region. Please try again.');
      }
    } catch (error: any) {
      toast({
        title: 'Error Saving Region',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // The Dialog's open state is controlled by the isOpen prop
  // which comes from AuthContext's promptRegionSelection.
  // We don't need an onOpenChange here because closing the dialog
  // should only happen after successful region selection.
  // If the user dismisses it via Escape or clicking outside (if enabled),
  // it will re-appear until the region is set.

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Globe className="mr-2 h-6 w-6 text-primary" />
            Select Your Preferred Region
          </DialogTitle>
          <DialogDescription className="pt-2">
            Please select your region. This helps us tailor your experience and display currency correctly.
            This selection is one-time and helps us serve you better.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="region-modal-select">Region</Label>
            <Select
              value={selectedRegion}
              onValueChange={(value) => setSelectedRegion(value as UserRegion)}
            >
              <SelectTrigger id="region-modal-select">
                <SelectValue placeholder="Choose your region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIA">INDIA (₹ INR)</SelectItem>
                <SelectItem value="USA">USA ($ USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveRegion} disabled={isSaving || !selectedRegion}>
            {isSaving && <Spinner size="small" className="mr-2" />}
            Save Region
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
