'use client';

import * as React from 'react';
import { Header } from '@/components/layout/Header';
import { applications as mockApplications, users as mockUsers } from '@/lib/mock-data';
import type { Application, User } from '@/lib/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { YetToApplyList } from '@/components/applications/YetToApplyList';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';

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

  const handleRemoveUser = (userIdToRemove: string) => {
    const userToRemove = users.find(u => u.id === userIdToRemove);
    if (!userToRemove) return;

    const newUsers = users.filter(u => u.id !== userIdToRemove);
    setUsers(newUsers);
    setApplications(prev => prev.filter(app => app.userId !== userIdToRemove));

    toast({
      title: 'User Removed',
      description: `${userToRemove.firstName} ${userToRemove.lastName} and all their applications have been removed.`,
    });

    if (selectedUser === userIdToRemove) {
      if (newUsers.length > 0) {
        setSelectedUser(newUsers[0].id);
      } else {
        setSelectedUser('all'); 
      }
    }
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
      prev.map(app => {
        if (app.id === appId) {
          const updatedApp = { ...app, ...data };
          
          if (data.status && data.status !== 'Yet to Apply' && !app.appliedOn) {
            updatedApp.appliedOn = new Date().toISOString();
          }

          return updatedApp;
        }
        return app;
      })
    );
  };
  
  const handleRemoveApplication = (appIdToRemove: string) => {
    const appToRemove = applications.find(app => app.id === appIdToRemove);
    if (!appToRemove) return;

    setApplications(prev => prev.filter(app => app.id !== appIdToRemove));

    toast({
      title: 'Application Removed',
      description: `${appToRemove.jobTitle} at ${appToRemove.companyName} has been removed.`,
    });
  };

  const filteredApplications = applications.filter(app => {
    const userMatch = selectedUser === 'all' || app.userId === selectedUser;
    return userMatch;
  });

  const yetToApplyApplications = filteredApplications.filter(app => {
    return app.status === 'Yet to Apply';
  });

  const kanbanApplications = filteredApplications.filter(app => app.status !== 'Yet to Apply');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header 
        users={users} 
        selectedUser={selectedUser} 
        onUserChange={setSelectedUser}
        onUserAdded={handleAddUser}
        onApplicationAdded={handleAddApplication}
        onUserRemoved={handleRemoveUser}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <AnalyticsOverview applications={filteredApplications} />
        <YetToApplyList 
            applications={yetToApplyApplications} 
            onApplicationUpdate={handleUpdateApplication}
            onApplicationDelete={handleRemoveApplication}
        />
        <Separator />
        <KanbanBoard 
          applications={kanbanApplications} 
          onApplicationUpdate={handleUpdateApplication}
          onApplicationDelete={handleRemoveApplication}
        />
      </main>
    </div>
  );
}
