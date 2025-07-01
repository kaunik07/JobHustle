
import { db } from '@/lib/db';
import { applications as applicationsSchema, users as usersSchema } from '@/lib/db/schema';
import { eq, desc, distinct } from 'drizzle-orm';
import type { Application, User } from '@/lib/types';
import { JobTrackerClient } from '@/components/layout/JobTrackerClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { suggestedLocations } from '@/lib/types';

export default async function Home({
  searchParams,
}: {
  searchParams: { user?: string; type?: string; category?: string };
}) {
  try {
    const allUsers: User[] = await db.select().from(usersSchema);

    if (allUsers.length === 0) {
      // If there are no users, we can show the main screen with a prompt to add one.
      return <JobTrackerClient users={[]} applications={[]} selectedUserId="all" selectedType="all" selectedCategory="all" allLocations={suggestedLocations} />;
    }
    
    // Determine the selected user ID
    const userParam = searchParams.user;
    let selectedUserId: string;

    if (!userParam || userParam === 'all') {
      selectedUserId = 'all';
    } else {
      const userExists = allUsers.some(u => u.id === userParam);
      selectedUserId = userExists ? userParam : 'all';
    }
    
    const selectedType = searchParams.type || 'all';
    const selectedCategory = searchParams.category || 'all';
    
    // Fetch all applications and let the client component handle filtering
    const results = await db
      .select({
        application: applicationsSchema,
        user: usersSchema,
      })
      .from(applicationsSchema)
      .leftJoin(usersSchema, eq(applicationsSchema.userId, usersSchema.id))
      .orderBy(desc(applicationsSchema.createdAt));
    
    const applicationsForClient = results.map(r => ({
      ...(r.application as Omit<Application, 'user'>),
      user: r.user as User,
    }));

    const locationsResult = await db.selectDistinct({ location: applicationsSchema.location }).from(applicationsSchema);
    const dbLocations = locationsResult.map(l => l.location).filter(Boolean) as string[];
    const allLocations = [...new Set([...suggestedLocations, ...dbLocations])];


    return (
      <JobTrackerClient
        users={allUsers}
        applications={applicationsForClient}
        selectedUserId={selectedUserId}
        selectedType={selectedType}
        selectedCategory={selectedCategory}
        allLocations={allLocations}
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
