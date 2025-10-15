
import { db } from '@/lib/db';
import { applications as applicationsSchema, users as usersSchema, resumes as resumesSchema } from '@/lib/db/schema';
import { eq, desc, or, inArray } from 'drizzle-orm';
import type { Application, User, Resume, ResumeScore } from '@/lib/types';
import { JobTrackerClient } from '@/components/layout/JobTrackerClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { suggestedLocations } from '@/lib/types';
import { getSession } from '@/app/auth/actions';
import { redirect } from 'next/navigation';

export default async function Home({
  searchParams,
}: {
  searchParams: { user?: string; type?: string; category?: string; location?: string; company?: string, resume?: string };
}) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect('/login');
  }

  try {
    const allUsers: User[] = await db.query.users.findMany();

    if (allUsers.length === 0) {
      // If there are no users, we can show the main screen with a prompt to add one.
      return <JobTrackerClient users={[]} applications={[]} resumes={[]} selectedUserId="all" selectedType="all" selectedCategory="all" selectedLocation="" selectedCompany="" selectedResumeId="" allLocations={suggestedLocations} session={session}/>;
    }
    
    // Determine the selected user ID and filter criteria for applications
    let selectedUserId: string;
    const userParam = searchParams.user;
    let applicationFilter;

    const loggedInUsername = session.user?.username?.toLowerCase();
    
    // Master admin logic
    if (loggedInUsername === 'admin') {
      if (!userParam || userParam === 'all') {
        selectedUserId = 'all';
        // No user filter needed for applications
      } else {
        const userExists = allUsers.some(u => u.id === userParam);
        selectedUserId = userExists ? userParam : 'all';
        if (selectedUserId !== 'all') {
          applicationFilter = eq(applicationsSchema.userId, selectedUserId);
        }
      }
    } else if (loggedInUsername === 'manvi') {
        const peerUsernames = ['kaunik', 'manvi'];
        const peerUsers = allUsers.filter(u => peerUsernames.includes(u.username.toLowerCase()));
        const peerUserIds = peerUsers.map(u => u.id);
        
        if (!userParam || userParam === 'mp-kk') {
            selectedUserId = 'mp-kk';
            applicationFilter = inArray(applicationsSchema.userId, peerUserIds);
        } else if (userParam && peerUserIds.includes(userParam)) {
            selectedUserId = userParam;
            applicationFilter = eq(applicationsSchema.userId, selectedUserId);
        } else {
            // Fallback to combined view if user param is invalid for them
            selectedUserId = 'mp-kk';
            applicationFilter = inArray(applicationsSchema.userId, peerUserIds);
        }
    } else {
      // For kaunik or any other standard user, they can only see their own data
      selectedUserId = session.user.id;
      applicationFilter = eq(applicationsSchema.userId, selectedUserId);
    }

    const selectedType = searchParams.type || 'all';
    const selectedCategory = searchParams.category || 'all';
    const selectedLocation = searchParams.location || '';
    const selectedCompany = searchParams.company || '';
    const selectedResumeId = searchParams.resume || '';
    
    // Fetch all applications and let the client component handle filtering
    const results = await db.query.applications.findMany({
        where: applicationFilter,
        with: {
            user: {
              with: {
                resumes: true,
              }
            },
            resumeScores: {
                with: {
                    resume: {
                        columns: {
                            id: true,
                            name: true,
                            createdAt: true,
                        }
                    }
                }
            },
            customLatexResume: true,
        },
        orderBy: desc(applicationsSchema.createdAt)
    });
    
    const applicationsForClient: Application[] = results.map(r => ({
      ...r,
      locations: r.locations ? r.locations.split(',').map(l => l.trim()) : [],
      user: r.user as User,
      resumeScores: r.resumeScores.map(score => ({
        ...score,
        resume: score.resume!
      })) as ResumeScore[],
      customLatexResume: r.customLatexResume,
    }));


    const dbLocations = results.flatMap(r => r.locations ? r.locations.split(',').map(l => l.trim()) : []).filter(Boolean);
    const allLocations = [...new Set([...suggestedLocations, ...dbLocations])];

    let resumesForUser: Resume[] = [];
    if (selectedUserId !== 'all' && selectedUserId !== 'mp-kk') {
      resumesForUser = await db.select().from(resumesSchema).where(eq(resumesSchema.userId, selectedUserId)).orderBy(desc(resumesSchema.createdAt));
    } else if (session.user) {
      // For master user viewing "All", or peer users, we can load their own resumes for now
      resumesForUser = await db.select().from(resumesSchema).where(eq(resumesSchema.userId, session.user.id)).orderBy(desc(resumesSchema.createdAt));
    }


    return (
      <JobTrackerClient
        session={session}
        users={allUsers}
        applications={applicationsForClient}
        resumes={resumesForUser}
        selectedUserId={selectedUserId}
        selectedType={selectedType}
        selectedCategory={selectedCategory}
        selectedLocation={selectedLocation}
        selectedCompany={selectedCompany}
        selectedResumeId={selectedResumeId}
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
