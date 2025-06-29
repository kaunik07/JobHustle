
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
  const allUsers = await db.select().from(usersSchema);

  // Determine the selected user
  let selectedUser: User | undefined = allUsers.find(u => u.id === searchParams.user);
  if (!selectedUser && searchParams.user !== 'all') {
    selectedUser = allUsers.find(u => u.firstName === 'U') || allUsers[0];
  }
  const selectedUserId = searchParams.user === 'all' ? 'all' : selectedUser?.id || 'all';

  // Base query
  let query = db
    .select({
      application: applicationsSchema,
      user: usersSchema,
    })
    .from(applicationsSchema)
    .leftJoin(usersSchema, eq(applicationsSchema.userId, usersSchema.id))
    .orderBy(desc(applicationsSchema.appliedOn));

  // Filter by user if one is selected
  if (selectedUserId && selectedUserId !== 'all') {
    query.where(eq(applicationsSchema.userId, selectedUserId));
  }
  
  const results = await query;
  
  const allApplications: Application[] = results.map(r => ({
    ...(r.application as Omit<Application, 'user'>),
    user: r.user as User,
  }));

  return (
    <JobTrackerClient
      users={allUsers}
      applications={allApplications}
      selectedUserId={selectedUserId}
    />
  );
}
