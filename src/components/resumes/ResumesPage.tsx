'use client';

import * as React from 'react';
import { deleteResume } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { type Resume, type User } from '@/lib/types';
import { FileText, Trash2, Calendar } from 'lucide-react';
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

interface ResumesPageProps {
  user: User;
  resumes: Resume[];
  onFilterByResume: (resumeId: string) => void;
}

export function ResumesPage({ user, resumes, onFilterByResume }: ResumesPageProps) {
  const { toast } = useToast();

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
        <AddResumeDialog user={user} />
      </div>

      {resumes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map(resume => (
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
            <h3 className="mt-4 text-lg font-semibold">No Resumes Found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Get started by uploading your first resume.
            </p>
            <AddResumeDialog user={user} />
        </div>
      )}
    </div>
  );
}
