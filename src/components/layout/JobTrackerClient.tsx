
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import type { Application, User, Resume } from '@/lib/types';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { YetToApplyList } from '@/components/applications/YetToApplyList';
import { Separator } from '@/components/ui/separator';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { deleteUser as deleteUserAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { kanbanStatuses } from '@/lib/types';
import { RejectedList } from '../applications/RejectedList';
import { FilterSidebar } from './FilterSidebar';
import { AllUsersAnalytics } from '@/components/analytics/AllUsersAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResumesPage } from '@/components/resumes/ResumesPage';


interface JobTrackerClientProps {
    users: User[];
    applications: Application[];
    resumes: Resume[];
    selectedUserId: string;
    selectedType: string;
    selectedCategory: string;
    selectedLocation: string;
    selectedCompany: string;
    allLocations: string[];
}

export function JobTrackerClient({ 
    users, applications, resumes,
    selectedUserId, selectedType, selectedCategory, selectedLocation, selectedCompany,
    allLocations 
}: JobTrackerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [locationQuery, setLocationQuery] = React.useState(selectedLocation);
  const [companyQuery, setCompanyQuery] = React.useState(selectedCompany);
  
  const updateQuery = (key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === 'all' || !value) {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/${query}`);
  }

  React.useEffect(() => {
    const handler = setTimeout(() => {
        if (locationQuery !== selectedLocation) {
            updateQuery('location', locationQuery);
        }
    }, 500);
    return () => clearTimeout(handler);
  }, [locationQuery, selectedLocation]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
        if (companyQuery !== selectedCompany) {
            updateQuery('company', companyQuery);
        }
    }, 500);
    return () => clearTimeout(handler);
  }, [companyQuery, selectedCompany]);


  const handleUserChange = (userId: string) => {
    updateQuery('user', userId);
  };
  
  const handleTypeChange = (type: string) => {
    updateQuery('type', type);
  };
  
  const handleCategoryChange = (category: string) => {
    updateQuery('category', category);
  };

  const handleRemoveUser = async (userIdToRemove: string) => {
    const userToRemove = users.find(u => u.id === userIdToRemove);
    if (!userToRemove) return;

    await deleteUserAction(userIdToRemove);

    toast({
      title: 'User Removed',
      description: `${userToRemove.firstName} ${userToRemove.lastName} and all their applications have been removed.`,
    });
    
    if (selectedUserId === userIdToRemove) {
      router.push('/?user=all');
    }
  };

  const filteredApplications = applications.filter(app => {
    const userMatch = selectedUserId === 'all' || app.userId === selectedUserId;
    const typeMatch = selectedType === 'all' || app.type === selectedType;
    const categoryMatch = selectedCategory === 'all' || app.category === selectedCategory;
    const locationMatch = !selectedLocation || (app.location && app.location.toLowerCase().includes(selectedLocation.toLowerCase()));
    const companyMatch = !selectedCompany || (app.companyName && app.companyName.toLowerCase().includes(selectedCompany.toLowerCase()));
    return userMatch && typeMatch && categoryMatch && locationMatch && companyMatch;
  });

  const yetToApplyApplications = filteredApplications.filter(app => app.status === 'Yet to Apply');
  const kanbanApplications = filteredApplications.filter(app => kanbanStatuses.includes(app.status));
  const rejectedApplications = filteredApplications.filter(app => app.status === 'Rejected');
  
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="flex min-h-screen w-full flex-col">
       <FilterSidebar 
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        locationQuery={locationQuery}
        onLocationChange={setLocationQuery}
        companyQuery={companyQuery}
        onCompanyChange={setCompanyQuery}
      />
      <div className="pl-16">
        <Header 
          users={users} 
          selectedUser={selectedUserId} 
          onUserChange={handleUserChange}
          onUserRemoved={handleRemoveUser}
          allLocations={allLocations}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Tabs defaultValue="board" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="board">Job Board</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="resumes" disabled={selectedUserId === 'all'}>
                        My Resumes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="board" className="space-y-6">
                    <YetToApplyList applications={yetToApplyApplications} selectedUserId={selectedUserId} resumes={resumes} />
                    <Separator />
                    <KanbanBoard applications={kanbanApplications} selectedUserId={selectedUserId} resumes={resumes} />
                    <Separator />
                    <RejectedList applications={rejectedApplications} selectedUserId={selectedUserId} resumes={resumes} />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <AnalyticsOverview applications={filteredApplications} />
                    <AllUsersAnalytics users={users} applications={filteredApplications} />
                </TabsContent>

                <TabsContent value="resumes">
                    {selectedUser ? (
                        <ResumesPage 
                            user={selectedUser} 
                            resumes={resumes} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-24 rounded-md border-2 border-dashed">
                            <p className="text-muted-foreground">Select a user to manage their resumes.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </main>
      </div>
    </div>
  );
}
