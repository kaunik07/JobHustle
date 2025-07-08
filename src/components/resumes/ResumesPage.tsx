
'use client';

import * as React from 'react';
import { deleteResume } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { type Resume, type User } from '@/lib/types';
import { FileText, Trash2, Calendar, FileJson, Pencil } from 'lucide-react';
import { AddResumeDialog } from './AddResumeDialog';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface ResumesPageProps {
  user: User;
  resumes: Resume[];
  onFilterByResume: (resumeId: string) => void;
}

export function ResumesPage({ user, resumes, onFilterByResume }: ResumesPageProps) {
  const { toast } = useToast();

  const pdfResumes = React.useMemo(() => resumes.filter(r => r.resumeText), [resumes]);
  const latexResumes = React.useMemo(() => resumes.filter(r => r.latexContent), [resumes]);

  const handleDelete = async (resumeId: string) => {
    try {
      await deleteResume(resumeId);
      toast({ title: 'Resume deleted.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete resume.' });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Resumes</h2>
          <p className="text-muted-foreground">Manage your uploaded resumes for {`${user.firstName} ${user.lastName}`.trim()}.</p>
        </div>
        <div className="flex gap-2">
          <AddResumeDialog user={user} />
           <Link href={`/resumes/new-latex?user=${user.id}`}>
            <Button variant="outline">
                <FileJson className="mr-2 h-4 w-4" /> Create LaTeX Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* LaTeX Resumes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight">LaTeX Resumes</h3>
        {latexResumes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latexResumes.map(resume => (
              <Card key={resume.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <FileJson className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <CardTitle>{resume.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-xs pt-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 font-mono">
                    {resume.latexContent || "Empty LaTeX content."}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link href={`/resumes/edit-latex/${resume.id}?user=${user.id}`}>
                     <Button variant="outline" size="sm">
                       <Pencil className="mr-2 h-4 w-4" />
                       Edit
                     </Button>
                  </Link>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the LaTeX resume named "{resume.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resume.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <FileJson className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No LaTeX Resumes Found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Create your first LaTeX resume to get started.
            </p>
            <Link href={`/resumes/new-latex?user=${user.id}`}>
                <Button variant="outline">
                    <FileJson className="mr-2 h-4 w-4" /> Create LaTeX Resume
                </Button>
            </Link>
          </div>
        )}
      </div>

      <Separator />

      {/* PDF Resumes */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight">PDF Resumes (for AI Scoring)</h3>
        {pdfResumes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pdfResumes.map(resume => (
              <Card key={resume.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <CardTitle>{resume.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-xs pt-1">
                          <Calendar className="h-3 w-3" />
                          Uploaded {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                    {resume.applicationCount !== undefined && resume.applicationCount > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-auto shrink-0 rounded-full px-2.5 py-1 text-xs"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onFilterByResume(resume.id);
                                }}
                              >
                                  Used in {resume.applicationCount} {resume.applicationCount === 1 ? 'app' : 'apps'}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Filter applications by this resume</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-24 rounded-md border p-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {resume.resumeText}
                    </p>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the resume named "{resume.name}". Any applications linked to it will lose the association.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resume.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No PDF Resumes Found</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                  Upload your first PDF resume to enable AI scoring.
              </p>
              <AddResumeDialog user={user} />
          </div>
        )}
      </div>
    </div>
  );
}
