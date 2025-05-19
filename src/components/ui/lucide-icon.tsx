// src/components/ui/lucide-icon.tsx
'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface LucideIconProps extends LucideIcons.LucideProps {
  name: string;
}

const LucideIconComponent = ({ name, className, ...props }: LucideIconProps) => {
  let IconComponent: LucideIcons.LucideIcon | undefined = undefined;
  
  if (name) {
    // Lucide icons are typically PascalCase, e.g., Gamepad2
    // 1. Try exact name first (if user already typed PascalCase)
    IconComponent = LucideIcons[name as keyof typeof LucideIcons];

    // 2. If not found, try converting to PascalCase (e.g., from "gamepad2" or "gamepad-2")
    if (!IconComponent) {
      const parts = name.split(/[-_ ]/);
      const pascalCaseName = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('');
      IconComponent = LucideIcons[pascalCaseName as keyof typeof LucideIcons];
    }
  }
  
  const FinalIconComponent = IconComponent || LucideIcons.HelpCircle;

  // Ensure it's a component and not something like 'createLucideIcon' function also exported by the library
  if (typeof FinalIconComponent === 'function' && FinalIconComponent.displayName !== 'createLucideIcon') {
    return <FinalIconComponent className={className} {...props} />;
  }

  // Fallback if no valid component found
  return <LucideIcons.HelpCircle className={className} {...props} />;
};

export const LucideIcon = React.memo(LucideIconComponent);
