
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import type { Application, User } from '@/lib/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { YetToApplyList } from '@/components/applications/YetToApplyList';
import { Separator } from '@/components/ui/separator';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { deleteUser as deleteUserAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { kanbanStatuses } from '@/lib/types';
import { RejectedList } from '../applications/RejectedList';

interface JobTrackerClientProps {
    users: User[];
    applications: Application[];
    selectedUserId: string;
}

export function JobTrackerClient({ users, applications, selectedUserId }: JobTrackerClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const handleUserChange = (userId: string) => {
    router.push(`/?user=${userId}`);
  };

  const handleRemoveUser = async (userIdToRemove: string) => {
    const userToRemove = users.find(u => u.id === userIdToRemove);
    if (!userToRemove) return;

    await deleteUserAction(userIdToRemove);

    toast({
      title: 'User Removed',
      description: `${userToRemove.firstName} ${userToRemove.lastName} and all their applications have been removed.`,
    });
    
    // If the deleted user was selected, navigate to 'all'
    if (selectedUserId === userIdToRemove) {
      router.push('/?user=all');
    }
  };

  const yetToApplyApplications = applications.filter(app => {
    return app.status === 'Yet to Apply';
  });

  const kanbanApplications = applications.filter(app => kanbanStatuses.includes(app.status));
  
  const rejectedApplications = applications.filter(app => app.status === 'Rejected');

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header 
        users={users} 
        selectedUser={selectedUserId} 
        onUserChange={handleUserChange}
        onUserRemoved={handleRemoveUser}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <AnalyticsOverview applications={applications} />
        <YetToApplyList applications={yetToApplyApplications} />
        <Separator />
        <KanbanBoard applications={kanbanApplications} />
        <Separator />
        <RejectedList applications={rejectedApplications} />
      </main>
    </div>
  );
}
