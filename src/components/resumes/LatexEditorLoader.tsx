'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Resume, User } from '@/lib/types';

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

interface LatexEditorLoaderProps {
    user: User;
    resume?: Resume;
}

export function LatexEditorLoader({ user, resume }: LatexEditorLoaderProps) {
    return <LatexEditorForm user={user} resume={resume} />;
}
