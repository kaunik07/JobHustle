
import { db } from '@/lib/db';
import { resumes as resumesSchema } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { LatexEditorForm } from '@/components/resumes/LatexEditorForm';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';

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
      <Header users={allUsers} selectedUser={userId} onUserChange={() => {}} onUserRemoved={() => {}} allLocations={[]} />
      <main className="p-4 md:p-8">
        <LatexEditorForm user={resume.user} resume={resume} />
      </main>
    </div>
  );
}
