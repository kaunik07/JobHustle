
'use client';

import * as React from 'react';
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
import { type Application, type ApplicationStatus, statuses } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Trash2, CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ApplicationDetailsDialogProps {
  application: Application;
  children: React.ReactNode;
  onApplicationUpdate: (appId: string, data: Partial<Application>) => void;
}

export function ApplicationDetailsDialog({ application, children, onApplicationUpdate }: ApplicationDetailsDialogProps) {
  const { toast } = useToast();
  const companyDomain = application.companyName.toLowerCase().replace(/[^a-z0-9]/gi, '') + '.com';
  const [currentNotes, setCurrentNotes] = React.useState(application.notes || '');

  const handleNotesBlur = () => {
    if (currentNotes !== (application.notes || '')) {
      onApplicationUpdate(application.id, { notes: currentNotes });
      toast({ title: "Notes updated." });
    }
  };

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    onApplicationUpdate(application.id, { status: newStatus });
    toast({ title: `Status changed to ${newStatus}.` });
  };

  const handleDateChange = (date: Date | undefined, field: 'appliedOn' | 'dueDate') => {
    if (date) {
        onApplicationUpdate(application.id, { [field]: date.toISOString() });
        toast({ title: `${field === 'appliedOn' ? 'Applied date' : 'Due date'} updated.` });
    }
  };


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg">
              <AvatarImage 
                data-ai-hint={`${application.companyName} logo`} 
                src={`https://logo.clearbit.com/${companyDomain}`} 
                alt={application.companyName} 
              />
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
        <div className="grid gap-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2">
                <Badge variant="secondary">{application.status}</Badge>
                <Badge variant="outline">{application.category}</Badge>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Change status:</span>
                 <Select value={application.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {application.status !== 'Yet to Apply' && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Applied On</label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !application.appliedOn && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {application.appliedOn ? format(new Date(application.appliedOn), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={application.appliedOn ? new Date(application.appliedOn) : undefined}
                        onSelect={(date) => handleDateChange(date, 'appliedOn')}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
            )}
             {['OA', 'Interview'].includes(application.status) && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Due Date</label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !application.dueDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {application.dueDate ? format(new Date(application.dueDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={application.dueDate ? new Date(application.dueDate) : undefined}
                        onSelect={(date) => handleDateChange(date, 'dueDate')}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {application.user && <Badge variant="outline">Applied by {`${application.user.firstName} ${application.user.lastName}`.trim()}</Badge>}

          <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
            <ExternalLink className="h-4 w-4" />
            View Original Job Posting
          </a>

          <div className="space-y-2">
            <h3 className="font-semibold">Notes</h3>
            <Textarea
              placeholder="Add your notes here..."
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              onBlur={handleNotesBlur}
              className="min-h-[100px] text-sm"
            />
          </div>

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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
