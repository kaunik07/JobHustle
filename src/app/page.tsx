
'use client';

import * as React from 'react';
import { Header } from '@/components/layout/Header';
import { applications as mockApplications, users as mockUsers } from '@/lib/mock-data';
import type { Application, User } from '@/lib/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { YetToApplyList } from '@/components/applications/YetToApplyList';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [users, setUsers] = React.useState<User[]>(mockUsers);
  const [applications, setApplications] = React.useState<Application[]>(
    mockApplications.map(app => ({
      ...app,
      user: users.find(u => u.id === app.userId),
    }))
  );
  
  const [selectedUser, setSelectedUser] = React.useState<string>(users.find(u => u.firstName === 'U')?.id || 'all');
  const { toast } = useToast();

  const handleAddUser = (userData: Omit<User, 'id' | 'avatarUrl'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      avatarUrl: 'https://placehold.co/40x40.png',
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleAddApplication = (appData: Omit<Application, 'id' | 'user'>) => {
    const usersToApplyFor = appData.userId === 'all' ? users : users.filter(u => u.id === appData.userId);
    
    const newApplications: Application[] = usersToApplyFor.map(user => ({
      ...appData,
      id: `app-${Date.now()}-${user.id}`,
      userId: user.id,
      user: user,
    }));

    setApplications(prev => [...prev, ...newApplications]);
  };

  const handleUpdateApplication = (
    appId: string,
    data: Partial<Application>
  ) => {
    setApplications(prev =>
      prev.map(app => (app.id === appId ? { ...app, ...data } : app))
    );
    toast({
      title: 'Application Updated',
      description: 'Your changes have been saved.',
    });
  };

  const yetToApplyApplications = applications.filter(app => {
    const userMatch = selectedUser === 'all' || app.userId === selectedUser;
    return app.status === 'Yet to Apply' && userMatch;
  });

  const kanbanApplications = applications.filter(app => app.status !== 'Yet to Apply');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header 
        users={users} 
        selectedUser={selectedUser} 
        onUserChange={setSelectedUser}
        onUserAdded={handleAddUser}
        onApplicationAdded={handleAddApplication}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <YetToApplyList 
            applications={yetToApplyApplications} 
            onApplicationUpdate={handleUpdateApplication}
        />
        <Separator />
        <KanbanBoard 
          applications={kanbanApplications} 
          users={users} 
          selectedUser={selectedUser}
          onUserChange={setSelectedUser}
          onApplicationUpdate={handleUpdateApplication}
        />
      </main>
    </div>
  );
}
