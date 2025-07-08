
import { db } from '@/lib/db';
import { resumes as resumesSchema } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LatexEditorForm = dynamic(
  () => import('@/components/resumes/LatexEditorForm').then((mod) => mod.LatexEditorForm),
  {
    ssr: false,
    loading: () => (
      <Card className="max-w-screen-xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[600px] w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="w-full aspect-[8.5/11]" />
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  }
);


export default async function EditLatexResumePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { user?: string };
}) {
  const resumeId = params.id;
  const userId = searchParams.user;

  if (!userId || userId === 'all') {
    redirect('/?error=No user selected');
  }

  const allUsers = await db.query.users.findMany();
  const resume = await db.query.resumes.findFirst({
    where: and(eq(resumesSchema.id, resumeId), eq(resumesSchema.userId, userId)),
    with: {
        user: true,
    }
  });

  if (!resume || !resume.user) {
    return (
        <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
            <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Resume Not Found</AlertTitle>
            <AlertDescription>
                The requested resume could not be found or you do not have permission to edit it.
            </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <Header users={allUsers} selectedUser={userId} allLocations={[]} />
      <main className="p-4 md:p-8">
        <LatexEditorForm user={resume.user} resume={resume} />
      </main>
    </div>
  );
}
