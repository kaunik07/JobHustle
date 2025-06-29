
import { db } from '@/lib/db';
import { applications as applicationsSchema, users as usersSchema } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Application, User } from '@/lib/types';
import { JobTrackerClient } from '@/components/layout/JobTrackerClient';

export default async function Home({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  let allUsers: User[] = [];
  let applicationsForClient: Application[] = [];

  try {
    allUsers = await db.select().from(usersSchema);
  } catch (e) {
    console.error("Database connection error while fetching users:", e);
    // Return the client with empty data to prevent a hard crash
    return <JobTrackerClient users={[]} applications={[]} selectedUserId="all" />;
  }
  
  // If there are no users, there's nothing to show.
  if (allUsers.length === 0) {
    return <JobTrackerClient users={[]} applications={[]} selectedUserId={'all'} />;
  }
  
  // Determine the selected user ID based on all available users
  let selectedUser: User | undefined = allUsers.find(u => u.id === searchParams.user);
  // Default to the user named 'U' or the first user if the param is invalid
  if (!selectedUser && searchParams.user !== 'all') {
    selectedUser = allUsers.find(u => u.firstName === 'U') || allUsers[0];
  }
  const selectedUserId = searchParams.user === 'all' ? 'all' : selectedUser?.id || 'all';
  
  // Now fetch applications for the selected user
  try {
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
    
    applicationsForClient = results.map(r => ({
      ...(r.application as Omit<Application, 'user'>),
      user: r.user as User,
    }));
  } catch (error) {
    console.error("Database connection error while fetching applications:", error);
    // applicationsForClient will remain an empty array, so the UI will show an empty state.
  }

  return (
    <JobTrackerClient
      users={allUsers}
      applications={applicationsForClient}
      selectedUserId={selectedUserId}
    />
  );
}
