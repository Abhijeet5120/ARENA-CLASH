// src/components/tournament/InfoItem.tsx
'use client';

import React from 'react'; 
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InfoItemProps {
  icon: LucideIcon; 
  label: string;
  value: string | number;
  link?: string;
  className?: string;
}

const InfoItemComponent = ({ icon: Icon, label, value, link, className }: InfoItemProps) => {
  const itemContent = (
    <>
      <div className="flex items-center text-sm text-muted-foreground mb-1">
        <Icon className="mr-2 h-4 w-4 min-w-[1rem] text-primary/90" />
        {label}
      </div>
      <p className="text-lg font-semibold text-foreground truncate" title={String(value)}>
        {value}
      </p>
    </>
  );

  return (
    <Card className={cn("bg-card/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-card/60 hover:backdrop-blur-md rounded-lg", className)}>
      <CardContent className="p-4">
        {link ? (
          <Link href={link} className="block group">
            <div className="group-hover:text-primary transition-colors duration-300 ease-in-out">
             {itemContent}
            </div>
          </Link>
        ) : (
          itemContent
        )}
      </CardContent>
    </Card>
  );
};

export const InfoItem = React.memo(InfoItemComponent);
