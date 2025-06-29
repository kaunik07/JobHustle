
'use client';

import * as React from 'react';
import { Header } from '@/components/layout/Header';
import { applications as mockApplications, users as mockUsers } from '@/lib/mock-data';
import { Application, User } from '@/lib/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { YetToApplyList } from '@/components/applications/YetToApplyList';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  // In a real app, this data would be fetched from a database.
  const applications: Application[] = mockApplications.map(app => ({
    ...app,
    user: mockUsers.find(u => u.id === app.userId),
  }));
  const users: User[] = mockUsers;
  
  const [selectedUser, setSelectedUser] = React.useState<string>(users.find(u => u.name === 'U')?.id || 'all');

  const yetToApplyApplications = applications.filter(app => {
    const userMatch = selectedUser === 'all' || app.userId === selectedUser;
    return app.status === 'Yet to Apply' && userMatch;
  });

  const kanbanApplications = applications.filter(app => app.status !== 'Yet to Apply');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header users={users} selectedUser={selectedUser} onUserChange={setSelectedUser} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <YetToApplyList applications={yetToApplyApplications} />
        <Separator />
        <KanbanBoard 
          initialApplications={kanbanApplications} 
          users={users} 
          selectedUser={selectedUser}
          onUserChange={setSelectedUser}
        />
      </main>
    </div>
  );
}
