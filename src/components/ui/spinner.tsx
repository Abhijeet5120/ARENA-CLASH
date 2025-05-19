// src/components/ui/spinner.tsx
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react"; 

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export function Spinner({ size = "medium", className }: SpinnerProps) {
  const sizeClasses = {
    small: "h-4 w-4", 
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <LoaderCircle
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  );
}
