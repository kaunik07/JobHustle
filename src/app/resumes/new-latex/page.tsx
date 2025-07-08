
import { db } from '@/lib/db';
import { users as usersSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LatexEditorLoader } from '@/components/resumes/LatexEditorLoader';


export default async function NewLatexResumePage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  const userId = searchParams.user;
  if (!userId || userId === 'all') {
    // Or redirect to a user selection page
    redirect('/?error=No user selected');
  }

  const allUsers = await db.query.users.findMany();
  const user = allUsers.find(u => u.id === userId);

  if (!user) {
    return (
        <div className="flex h-screen w-full items-center justify-center p-4 bg-background">
            <Alert variant="destructive" className="max-w-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>User Not Found</AlertTitle>
            <AlertDescription>
                The selected user could not be found. Please go back and select a valid user.
            </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="h-screen w-full bg-muted/40 flex flex-col">
        <Header users={allUsers} selectedUser={userId} allLocations={[]} />
        <main className="flex-1 flex flex-col min-h-0">
            <LatexEditorLoader user={user} />
        </main>
    </div>
  );
}
