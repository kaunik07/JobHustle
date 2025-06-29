import { Header } from '@/components/layout/Header';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { applications as mockApplications, users as mockUsers } from '@/lib/mock-data';
import { Application, User } from '@/lib/types';

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
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <KanbanBoard initialApplications={applications} users={users} />
      </main>
    </div>
  );
}
