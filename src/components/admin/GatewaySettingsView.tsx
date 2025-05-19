// src/components/admin/GatewaySettingsView.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle, QrCode, Save, UploadCloud } from 'lucide-react';
import type { QRCodeMapping } from '@/data/qrCodeMappings';
import { getAllQRCodeMappings, updateQRCodeMapping } from '@/data/qrCodeMappings';
import Image from 'next/image';

interface EditableQRCodeMapping extends QRCodeMapping {
  newQrCodeDataUri?: string | null; // For temporary preview/upload
  newDescription?: string;
  isSaving?: boolean;
  error?: string | null;
}

export function GatewaySettingsView() {
  const [mappings, setMappings] = useState<EditableQRCodeMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadMappings = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedMappings = await getAllQRCodeMappings();
      setMappings(fetchedMappings.map(m => ({
        ...m,
        newQrCodeDataUri: null,
        newDescription: m.description || '',
        isSaving: false,
        error: null,
      })).sort((a,b) => a.amount - b.amount));
    } catch (error) {
      console.error("Failed to load QR code mappings:", error);
      toast({ title: 'Error', description: 'Failed to load QR code mappings.', variant: 'destructive' });
      setMappings([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const handleInputChange = (index: number, field: 'newDescription', value: string) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, [field]: value, error: null } : m));
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid File Type', description: 'Please select an image file.', variant: 'destructive' });
        return;
    }
    if (file.size > 2 * 1024 * 1024) { 
        toast({ title: 'File Too Large', description: 'QR code image should be smaller than 2MB.', variant: 'destructive' });
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
        setMappings(prev => prev.map((m, i) => i === index ? { ...m, newQrCodeDataUri: reader.result as string, error: null } : m));
    };
    reader.onerror = () => {
        toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    };
    reader.readAsDataURL(file);
    if (event.target) event.target.value = ''; 
  };


  const handleSaveChanges = async (index: number) => {
    const mappingToUpdate = mappings[index];
    if (!mappingToUpdate) return;

    setMappings(prev => prev.map((m, i) => i === index ? { ...m, isSaving: true, error: null } : m));

    try {
      const qrToSave = mappingToUpdate.newQrCodeDataUri || mappingToUpdate.qrCodeDataUri;
      const descriptionToSave = mappingToUpdate.newDescription || mappingToUpdate.description;

      const updatedMappingFromServer = await updateQRCodeMapping(mappingToUpdate.amount, qrToSave, descriptionToSave);
      
      if (updatedMappingFromServer) {
        toast({ title: 'Success', description: `QR Code for ${mappingToUpdate.amount} credits updated.` });
        setMappings(prev => prev.map((m, i) => {
            if (i === index) {
                return {
                    id: updatedMappingFromServer.id,
                    amount: updatedMappingFromServer.amount,
                    qrCodeDataUri: updatedMappingFromServer.qrCodeDataUri,
                    description: updatedMappingFromServer.description || '',
                    newQrCodeDataUri: null, 
                    newDescription: updatedMappingFromServer.description || '', 
                    isSaving: false,
                    error: null
                };
            }
            return m;
        }));
      } else {
        throw new Error('Failed to update QR code mapping on the server.');
      }
    } catch (error: any) {
      console.error("Error updating QR code:", error);
      toast({ title: 'Error', description: error.message || 'Failed to update QR code.', variant: 'destructive' });
      setMappings(prev => prev.map((m, i) => i === index ? { ...m, isSaving: false, error: error.message || 'Failed to update.' } : m));
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="large" />
        <p className="ml-4 text-muted-foreground">Loading QR code settings...</p>
      </div>
    );
  }
  
  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-primary/15 transition-shadow duration-300 rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><QrCode className="mr-3 h-6 w-6 text-primary"/>QR Code Gateway Settings</CardTitle>
        <CardDescription>Manage QR codes for predefined credit amounts. Users will scan these to make payments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {mappings.length === 0 && !isLoading && (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg min-h-[150px] flex flex-col justify-center items-center">
                <AlertTriangle className="h-10 w-10 text-muted-foreground/50 mb-3"/>
                <p>No QR code mappings found. Default mappings should be created automatically.</p>
            </div>
        )}
        {mappings.map((mapping, index) => (
          <Card key={mapping.id} className="bg-muted/20 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-md">
            <CardTitle className="text-lg sm:text-xl mb-3">
              Payment QR for: <span className="text-primary">{mapping.amount} Credits</span>
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <div>
                    <Label htmlFor={`qrDescription-${mapping.id}`}>Description (Optional)</Label>
                    <Input
                        id={`qrDescription-${mapping.id}`}
                        value={mapping.newDescription ?? mapping.description ?? ''}
                        onChange={(e) => handleInputChange(index, 'newDescription', e.target.value)}
                        placeholder="e.g., UPI QR for 50 Credits"
                        className="mt-1"
                        disabled={mapping.isSaving}
                    />
                </div>
                 <div>
                  <Label htmlFor={`qrUpload-${mapping.id}`}>Upload New QR Code Image</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="file"
                      id={`qrUpload-${mapping.id}`}
                      accept="image/png, image/jpeg, image/webp"
                      style={{display: 'none'}}
                      ref={el => fileInputRefs.current[index] = el}
                      onChange={(e) => handleFileChange(e, index)}
                      disabled={mapping.isSaving}
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRefs.current[index]?.click()}
                        disabled={mapping.isSaving}
                        className="transform hover:scale-105 transition-transform"
                    >
                      <UploadCloud className="mr-2 h-4 w-4"/> Choose File
                    </Button>
                    <span className="text-xs text-muted-foreground">(Max 2MB)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 flex flex-col items-center md:items-end">
                <Label>Current/Preview QR Code:</Label>
                <div className="w-40 h-40 sm:w-48 sm:h-48 border bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden shadow-inner">
                  <Image
                    src={mapping.newQrCodeDataUri || mapping.qrCodeDataUri}
                    alt={`QR Code for ${mapping.amount}`}
                    width={192}
                    height={192}
                    className="object-contain"
                    key={mapping.id + '-' + (mapping.newQrCodeDataUri || mapping.qrCodeDataUri)} 
                  />
                </div>
              </div>
            </div>
            {mapping.error && (
                <p className="text-sm text-destructive mt-3 flex items-center">
                    <AlertTriangle className="mr-1.5 h-4 w-4 shrink-0" /> {mapping.error}
                </p>
            )}
            <CardFooter className="mt-6 p-0">
              <Button 
                onClick={() => handleSaveChanges(index)} 
                disabled={mapping.isSaving || (!mapping.newQrCodeDataUri && mapping.newDescription === mapping.description)}
                className="w-full sm:w-auto transform hover:scale-105 transition-transform"
              >
                {mapping.isSaving ? <Spinner size="small" className="mr-2"/> : <Save className="mr-2 h-4 w-4" />}
                {mapping.isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
