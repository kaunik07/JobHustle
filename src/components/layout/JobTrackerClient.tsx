
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
import { ResumesPage } from '@/components/resumes/ResumesPage';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';


interface JobTrackerClientProps {
    users: User[];
    applications: Application[];
    resumes: Resume[];
    selectedUserId: string;
    selectedType: string;
    selectedCategory: string;
    selectedLocation: string;
    selectedCompany: string;
    selectedResumeId: string;
    allLocations: string[];
}

export function JobTrackerClient({ 
    users, applications, resumes,
    selectedUserId, selectedType, selectedCategory, selectedLocation, selectedCompany,
    selectedResumeId,
    allLocations 
}: JobTrackerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [view, setView] = React.useState<'board' | 'resumes'>('board');
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
    if (userId === 'all') {
      setView('board');
    }
    updateQuery('user', userId);
    if (searchParams.has('resume')) {
        updateQuery('resume', '');
    }
  };
  
  const handleTypeChange = (type: string) => {
    updateQuery('type', type);
  };
  
  const handleCategoryChange = (category: string) => {
    updateQuery('category', category);
  };

  const handleFilterByResume = (resumeId: string) => {
    setView('board');
    updateQuery('resume', resumeId);
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
    const locationMatch = !selectedLocation || (app.locations && app.locations.some(loc => loc.toLowerCase().includes(selectedLocation.toLowerCase())));
    const companyMatch = !selectedCompany || (app.companyName && app.companyName.toLowerCase().includes(selectedCompany.toLowerCase()));
    const resumeMatch = !selectedResumeId || app.resumeId === selectedResumeId;
    return userMatch && typeMatch && categoryMatch && locationMatch && companyMatch && resumeMatch;
  });

  const usersForAnalytics = selectedUserId === 'all' 
    ? users 
    : users.filter(u => u.id === selectedUserId);

  const yetToApplyApplications = filteredApplications.filter(app => app.status === 'Yet to Apply');
  const kanbanApplications = filteredApplications.filter(app => kanbanStatuses.includes(app.status));
  const rejectedApplications = filteredApplications.filter(app => app.status === 'Rejected');
  
  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedResumeName = selectedResumeId ? resumes.find(r => r.id === selectedResumeId)?.name : null;


  const resumesWithCounts = React.useMemo(() => {
    if (!resumes || resumes.length === 0 || selectedUserId === 'all') {
        return resumes;
    }

    const applicationCounts = new Map<string, number>();
    const userApplications = applications.filter(app => app.userId === selectedUserId);

    for (const app of userApplications) {
        if (app.resumeId) {
            applicationCounts.set(app.resumeId, (applicationCounts.get(app.resumeId) || 0) + 1);
        }
    }

    return resumes.map(resume => ({
        ...resume,
        applicationCount: applicationCounts.get(resume.id) || 0,
    }));
  }, [resumes, applications, selectedUserId]);

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <FilterSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(p => !p)}
        currentView={view}
        onViewChange={setView}
        selectedUserId={selectedUserId}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        locationQuery={locationQuery}
        onLocationChange={setLocationQuery}
        companyQuery={companyQuery}
        onCompanyChange={setCompanyQuery}
      />
      <div className={cn("flex flex-col transition-all duration-300", sidebarOpen ? "md:pl-64" : "md:pl-16")}>
        <Header 
          users={users} 
          selectedUser={selectedUserId} 
          onUserChange={handleUserChange}
          onUserRemoved={handleRemoveUser}
          allLocations={allLocations}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {selectedResumeId && selectedResumeName && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border bg-card p-3">
                <span className="text-sm font-medium">Filtered by resume:</span>
                <Badge variant="secondary" className="text-sm">
                  {selectedResumeName}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => updateQuery('resume', '')} className="ml-auto -mr-2 h-8">
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            )}
            {view === 'board' ? (
              <div className="space-y-6">
                <AnalyticsOverview applications={filteredApplications} />
                <Separator />
                <AllUsersAnalytics users={usersForAnalytics} applications={filteredApplications} />
                <Separator />
                <YetToApplyList applications={yetToApplyApplications} selectedUserId={selectedUserId} />
                <Separator />
                <KanbanBoard applications={kanbanApplications} selectedUserId={selectedUserId} />
                <Separator />
                <RejectedList applications={rejectedApplications} selectedUserId={selectedUserId} />
              </div>
            ) : (
                <>
                  {selectedUser ? (
                      <ResumesPage 
                          user={selectedUser} 
                          resumes={resumesWithCounts} 
                          onFilterByResume={handleFilterByResume}
                      />
                  ) : (
                      <div className="flex items-center justify-center h-24 rounded-md border-2 border-dashed">
                          <p className="text-muted-foreground">Select a user to manage their resumes.</p>
                      </div>
                  )}
                </>
            )}
        </main>
      </div>
    </div>
  );
}
