import { Header } from '@/components/layout/Header';
import { applications as mockApplications, users as mockUsers } from '@/lib/mock-data';
import { Application, User } from '@/lib/types';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { TrendingUp } from 'lucide-react';

export default function Home() {
  // In a real app, this data would be fetched from a database.
  const applications: Application[] = mockApplications.map(app => ({
    ...app,
    user: mockUsers.find(u => u.id === app.userId),
  }));
  const users: User[] = mockUsers;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header users={users} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
        </div>
        <AnalyticsOverview applications={applications} />
        <ApplicationList applications={applications} />
      </main>
    </div>
  );
}
