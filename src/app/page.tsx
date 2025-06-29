
'use client';

import * as React from 'react';
import { Header } from '@/components/layout/Header';
import { applications as mockApplications, users as mockUsers } from '@/lib/mock-data';
import type { Application, User } from '@/lib/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { YetToApplyList } from '@/components/applications/YetToApplyList';
import { Separator } from '@/components/ui/separator';
import { fetchJobDescription } from '@/ai/flows/fetch-job-description';

export default function Home() {
  const [users, setUsers] = React.useState<User[]>(mockUsers);
  const [applications, setApplications] = React.useState<Application[]>(
    mockApplications.map(app => ({
      ...app,
      user: users.find(u => u.id === app.userId),
    }))
  );
  
  const [selectedUser, setSelectedUser] = React.useState<string>(users.find(u => u.firstName === 'U')?.id || 'all');

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
    
    const newApplications: Application[] = usersToApplyFor.map(user => {
      const newApp = {
        ...appData,
        id: `app-${Date.now()}-${user.id}`,
        userId: user.id,
        user: user,
      };
      
      if (appData.jobUrl) {
        fetchJobDescription({ jobUrl: appData.jobUrl })
          .then(result => {
            console.log(`Fetched job description for ${appData.companyName}:`, result.jobDescription.substring(0, 100) + '...');
            setApplications(prev => prev.map(a => a.id === newApp.id ? { ...a, jobDescription: result.jobDescription } : a));
          })
          .catch(error => {
            console.error(`Failed to fetch job description for ${appData.companyName}:`, error);
          });
      }
      return newApp;
    });

    setApplications(prev => [...prev, ...newApplications]);
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
