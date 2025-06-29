'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanFilters } from './KanbanFilters';
import { Application, User, statuses } from '@/lib/types';

interface KanbanBoardProps {
  initialApplications: Application[];
  users: User[];
}

export function KanbanBoard({ initialApplications, users }: KanbanBoardProps) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const userMatch = selectedUser === 'all' || app.userId === selectedUser;
      const categoryMatch = selectedCategory === 'all' || app.category === selectedCategory;
      return userMatch && categoryMatch;
    });
  }, [applications, selectedUser, selectedCategory]);

  const columns = useMemo(() => {
    return statuses.map(status => ({
      id: status,
      title: status,
      applications: filteredApplications.filter(app => app.status === status),
    }));
  }, [filteredApplications]);

  return (
    <div className="flex h-full flex-col gap-4">
      <KanbanFilters
        users={users}
        selectedUser={selectedUser}
        onUserChange={setSelectedUser}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="inline-grid h-full auto-cols-[280px] grid-flow-col gap-4">
          {columns.map(column => (
            <KanbanColumn key={column.id} title={column.title} applications={column.applications} />
          ))}
        </div>
      </div>
    </div>
  );
}
