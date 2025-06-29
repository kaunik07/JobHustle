'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Application } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ApplicationDetailsDialogProps {
  application: Application;
  children: React.ReactNode;
}

export function ApplicationDetailsDialog({ application, children }: ApplicationDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg">
              <AvatarImage data-ai-hint={`${application.companyName} logo`} src={`https://placehold.co/64x64.png`} alt={application.companyName} />
              <AvatarFallback className="rounded-lg text-2xl">{application.companyName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-bold">{application.jobTitle}</DialogTitle>
              <DialogDescription className="text-lg">
                at {application.companyName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{application.status}</Badge>
            <Badge variant="outline">{application.category}</Badge>
            {application.user && <Badge variant="outline">Applied by {application.user.name}</Badge>}
          </div>

          <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
            <ExternalLink className="h-4 w-4" />
            View Original Job Posting
          </a>

          <div className="space-y-2">
            <h3 className="font-semibold">Job Description</h3>
            <ScrollArea className="h-48 rounded-md border p-4">
                <p className="text-sm text-muted-foreground">
                    {application.jobDescription || 'No job description was fetched for this application.'}
                </p>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
