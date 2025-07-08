
import { db } from '@/lib/db';
import { users as usersSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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
    <div className="min-h-screen w-full bg-muted/40">
        <Header users={allUsers} selectedUser={userId} allLocations={[]} />
        <main className="p-4 md:p-8">
            <LatexEditorForm user={user} />
        </main>
    </div>
  );
}
