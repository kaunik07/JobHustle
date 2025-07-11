
import { db } from '@/lib/db';
import { applications as applicationsSchema, users as usersSchema, resumes as resumesSchema } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Application, User, Resume, ResumeScore } from '@/lib/types';
import { JobTrackerClient } from '@/components/layout/JobTrackerClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { suggestedLocations } from '@/lib/types';

export default async function Home({
  searchParams,
}: {
  searchParams: { user?: string; type?: string; category?: string; location?: string; company?: string, resume?: string };
}) {
  try {
    const allUsers: User[] = await db.query.users.findMany();

    if (allUsers.length === 0) {
      // If there are no users, we can show the main screen with a prompt to add one.
      return <JobTrackerClient users={[]} applications={[]} resumes={[]} selectedUserId="all" selectedType="all" selectedCategory="all" selectedLocation="" selectedCompany="" selectedResumeId="" allLocations={suggestedLocations} />;
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
    const selectedLocation = searchParams.location || '';
    const selectedCompany = searchParams.company || '';
    const selectedResumeId = searchParams.resume || '';
    
    // Fetch all applications and let the client component handle filtering
    const results = await db.query.applications.findMany({
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
    if (selectedUserId !== 'all') {
      resumesForUser = await db.select().from(resumesSchema).where(eq(resumesSchema.userId, selectedUserId)).orderBy(desc(resumesSchema.createdAt));
    } else {
      // If 'all' users are selected, we can fetch all resumes to have them ready if the user switches,
      // but the Resumes tab will be disabled anyway. So fetching them for the selected user is sufficient.
      // Or we can decide not to fetch any. Let's stick to fetching only for a specific user.
    }


    return (
      <JobTrackerClient
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
