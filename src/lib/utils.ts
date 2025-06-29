import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserColor(userId: string): string {
  const colors = [
    "bg-chart-1/20 text-chart-1 border border-chart-1/30",
    "bg-chart-2/20 text-chart-2 border border-chart-2/30",
    "bg-chart-3/20 text-chart-3 border border-chart-3/30",
    "bg-chart-4/20 text-chart-4 border border-chart-4/30",
    "bg-chart-5/20 text-chart-5 border border-chart-5/30",
    "bg-accent/20 text-accent-foreground border border-accent/30",
    "bg-primary/10 text-primary border border-primary/20",
  ];

  let hash = 0;
  if (userId.length === 0) return colors[0];
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash % colors.length);
  return colors[index];
}
