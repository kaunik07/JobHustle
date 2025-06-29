
'use client';

import { Application } from '@/lib/types';
import { KanbanCard } from './KanbanCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  title: string;
  applications: Application[];
  onApplicationUpdate: (appId: string, data: Partial<Application>) => void;
  onApplicationDelete: (appId: string) => void;
}

export function KanbanColumn({ title, applications, onApplicationUpdate, onApplicationDelete }: KanbanColumnProps) {
  return (
    <div className="flex h-full flex-col rounded-lg bg-secondary shadow-sm">
      <div className="flex items-center justify-between p-4">
        <h2 className="font-headline text-lg font-semibold text-primary">{title}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-sm font-medium text-secondary-foreground">
          {applications.length}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4 pt-0">
          {applications.map(app => (
            <KanbanCard key={app.id} application={app} onApplicationUpdate={onApplicationUpdate} onApplicationDelete={onApplicationDelete} />
          ))}
           {applications.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-border text-sm text-muted-foreground">
              No applications here.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
