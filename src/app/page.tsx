
import { db } from '@/lib/db';
import { applications as applicationsSchema, users as usersSchema } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Application, User } from '@/lib/types';
import { JobTrackerClient } from '@/components/layout/JobTrackerClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function Home({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  try {
    const allUsers: User[] = await db.select().from(usersSchema);

    if (allUsers.length === 0) {
      // If there are no users, we can show the main screen with a prompt to add one.
      return <JobTrackerClient users={[]} applications={[]} selectedUserId="all" />;
    }
    
    // Determine the selected user ID
    let selectedUser: User | undefined = allUsers.find(u => u.id === searchParams.user);
    if (!selectedUser && searchParams.user !== 'all') {
      selectedUser = allUsers.find(u => u.firstName === 'U') || allUsers[0];
    }
    const selectedUserId = searchParams.user === 'all' ? 'all' : selectedUser?.id || 'all';
    
    // Fetch applications for the selected user
    const query = db
      .select({
        application: applicationsSchema,
        user: usersSchema,
      })
      .from(applicationsSchema)
      .leftJoin(usersSchema, eq(applicationsSchema.userId, usersSchema.id))
      .orderBy(desc(applicationsSchema.appliedOn));

    if (selectedUserId !== 'all') {
      query.where(eq(applicationsSchema.userId, selectedUserId));
    }
    
    const results = await query;
    
    const applicationsForClient = results.map(r => ({
      ...(r.application as Omit<Application, 'user'>),
      user: r.user as User,
    }));

    return (
      <JobTrackerClient
        users={allUsers}
        applications={applicationsForClient}
        selectedUserId={selectedUserId}
      />
    );

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Database operation failed:", errorMessage);
    
    return (
      <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Operation Failed</AlertTitle>
          <AlertDescription>
            <p>Could not fetch data from the database.</p>
            <p className="mt-2">This can happen if the database is not running, not accessible, or if the connection URL is incorrect.</p>
            <details className="mt-4 text-xs bg-muted/50 p-2 rounded">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs font-mono">
                {errorMessage}
              </pre>
            </details>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
