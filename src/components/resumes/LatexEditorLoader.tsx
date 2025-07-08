'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { Resume, User } from '@/lib/types';

const LatexEditorForm = dynamic(
  () => import('@/components/resumes/LatexEditorForm').then((mod) => mod.LatexEditorForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-52" />
                    <Skeleton className="h-4 w-72" />
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-44" />
              <Skeleton className="h-10 w-36" />
            </div>
        </div>
        <div className="flex flex-1">
          <div className="flex-1 p-4 space-y-4 border-r">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2 flex flex-col flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="w-full flex-1" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-2">
             <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="w-full h-full" />
          </div>
        </div>
      </div>
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
