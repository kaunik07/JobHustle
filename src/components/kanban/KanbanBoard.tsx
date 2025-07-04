
'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { Application, kanbanStatuses, Resume } from '@/lib/types';

interface KanbanBoardProps {
  applications: Application[];
  selectedUserId: string;
  resumes: Resume[];
}

export function KanbanBoard({ applications, selectedUserId, resumes }: KanbanBoardProps) {

  const columns = useMemo(() => {
    return kanbanStatuses.map(status => ({
      id: status,
      title: status,
      applications: applications.filter(app => app.status === status),
    }));
  }, [applications]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex-1">
        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map(column => (
            <KanbanColumn 
              key={column.id} 
              title={column.title} 
              applications={column.applications}
              selectedUserId={selectedUserId}
              resumes={resumes}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
