
'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { Application, kanbanStatuses } from '@/lib/types';

interface KanbanBoardProps {
  applications: Application[];
  onApplicationUpdate: (appId: string, data: Partial<Application>) => void;
  onApplicationDelete: (appId: string) => void;
}

export function KanbanBoard({ applications, onApplicationUpdate, onApplicationDelete }: KanbanBoardProps) {

  const columns = useMemo(() => {
    return kanbanStatuses.map(status => ({
      id: status,
      title: status,
      applications: applications.filter(app => app.status === status),
    }));
  }, [applications]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="inline-grid h-full auto-cols-[280px] grid-flow-col gap-4">
          {columns.map(column => (
            <KanbanColumn 
              key={column.id} 
              title={column.title} 
              applications={column.applications}
              onApplicationUpdate={onApplicationUpdate} 
              onApplicationDelete={onApplicationDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
