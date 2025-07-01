
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
import { type Application, type ApplicationStatus, statuses, categories, type ApplicationCategory, type User, applicationTypes, type ApplicationType, workArrangements, type ApplicationWorkArrangement } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Trash2, CalendarIcon, CheckCircle2, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateApplication, deleteApplication } from '@/app/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ApplicationDetailsDialogProps {
  application: Application;
  children: React.ReactNode;
}

const categoryStyles: Record<ApplicationCategory, string> = {
  'SWE': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  'SRE/Devops': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Quant': 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  'Systems': 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  'Data Scientist': 'bg-chart-5/20 text-chart-5 border-chart-5/30',
};

const applicationTypeStyles: Record<ApplicationType, string> = {
  'Full-Time': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Internship': 'bg-chart-4/20 text-chart-4 border-chart-4/30',
};

const workArrangementStyles: Record<ApplicationWorkArrangement, string> = {
  'On-site': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  'Remote': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Hybrid': 'bg-chart-4/20 text-chart-4 border-chart-4/30',
};


export function ApplicationDetailsDialog({ application, children }: ApplicationDetailsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const companyDomain = application.companyName.toLowerCase().replace(/[^a-z0-9]/gi, '') + '.com';
  
  const [currentNotes, setCurrentNotes] = React.useState(application.notes || '');
  const [currentJobTitle, setCurrentJobTitle] = React.useState(application.jobTitle);
  const [currentCompanyName, setCurrentCompanyName] = React.useState(application.companyName);
  const [currentLocation, setCurrentLocation] = React.useState(application.location);
  const [currentResumeUrl, setCurrentResumeUrl] = React.useState(application.resumeUrl || '');

  const [oaDueTime, setOaDueTime] = React.useState('23:59');
  const [oaDueDateTimezone, setOaDueDateTimezone] = React.useState<string | null>(null);
  const [timezones, setTimezones] = React.useState<string[]>([]);
  const isInterviewStage = application.status === 'Interview';

  React.useEffect(() => {
    // This runs on client only and avoids hydration errors
    setTimezones(Intl.supportedValuesOf('timeZone'));
  }, []);

  React.useEffect(() => {
    if (open) {
      setCurrentJobTitle(application.jobTitle);
      setCurrentCompanyName(application.companyName);
      setCurrentLocation(application.location);
      setCurrentNotes(application.notes || '');
      setCurrentResumeUrl(application.resumeUrl || '');
      
      const initialTimezone = application.oaDueDateTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      setOaDueDateTimezone(initialTimezone);

      if (application.oaDueDate) {
          try {
              // This formats the stored UTC date into the wall-clock time of the stored timezone
              const timeFormatter = new Intl.DateTimeFormat('en-GB', {
                  timeZone: initialTimezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              });
              const formattedTime = timeFormatter.format(new Date(application.oaDueDate));
              setOaDueTime(formattedTime);
          } catch (e) {
              console.error("Invalid timezone, falling back to local format", e);
              setOaDueTime(format(new Date(application.oaDueDate), 'HH:mm'));
          }
      } else {
          setOaDueTime('23:59');
      }
    }
  }, [application, open]);

  const handleUpdate = async (data: Partial<Omit<Application, 'id'>>) => {
    try {
      await updateApplication(application.id, data);
      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed. Please try again.' });
      return false;
    }
  };

  const handleResumeUrlBlur = async () => {
    if (currentResumeUrl !== (application.resumeUrl || '')) {
      const success = await handleUpdate({ resumeUrl: currentResumeUrl.trim() === '' ? null : currentResumeUrl });
      if (success) {
        toast({ title: 'Resume updated.' });
      }
    }
  };

  const handleClearResume = async () => {
    const success = await handleUpdate({ resumeUrl: null });
    if (success) {
      setCurrentResumeUrl('');
      toast({ title: 'Resume removed.' });
    }
  };

  const handleJobTitleBlur = async () => {
    if (currentJobTitle.trim() === '') {
        setCurrentJobTitle(application.jobTitle);
        toast({ variant: "destructive", title: "Job title cannot be empty." });
        return;
    }
    if (currentJobTitle !== application.jobTitle) {
      if (await handleUpdate({ jobTitle: currentJobTitle })) {
        toast({ title: "Job title updated." });
      }
    }
  };

  const handleCompanyNameBlur = async () => {
    if (currentCompanyName.trim() === '') {
        setCurrentCompanyName(application.companyName);
        toast({ variant: "destructive", title: "Company name cannot be empty." });
        return;
    }
    if (currentCompanyName !== application.companyName) {
      if (await handleUpdate({ companyName: currentCompanyName })) {
        toast({ title: "Company name updated." });
      }
    }
  };

  const handleLocationBlur = async () => {
    if (currentLocation.trim() === '') {
        setCurrentLocation(application.location);
        toast({ variant: "destructive", title: "Location cannot be empty." });
        return;
    }
    if (currentLocation !== application.location) {
      if (await handleUpdate({ location: currentLocation })) {
        toast({ title: "Location updated." });
      }
    }
  };

  const handleNotesBlur = async () => {
    if (currentNotes !== (application.notes || '')) {
      if (await handleUpdate({ notes: currentNotes })) {
        toast({ title: "Notes updated." });
      }
    }
  };

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    const data: Partial<Application> = { status: newStatus };
    if (newStatus !== 'Yet to Apply' && !application.appliedOn) {
      data.appliedOn = new Date();
    }
    if (await handleUpdate(data)) {
      toast({ title: `Status changed to ${newStatus}.` });
    }
  };

  const handleQuickApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleStatusChange('Applied');
  };

  const handleTypeChange = async (newType: ApplicationType) => {
    if (await handleUpdate({ type: newType })) {
      toast({ title: `Type changed to ${newType}.` });
    }
  };
  
  const handleCategoryChange = async (newCategory: ApplicationCategory) => {
    if (await handleUpdate({ category: newCategory })) {
      toast({ title: `Category changed to ${newCategory}.` });
    }
  };

  const handleWorkArrangementChange = async (newWorkArrangement: ApplicationWorkArrangement) => {
    if (await handleUpdate({ workArrangement: newWorkArrangement })) {
      toast({ title: `Work arrangement changed to ${newWorkArrangement}.` });
    }
  };

  const handleAppliedOnChange = async (date: Date | undefined) => {
    if (await handleUpdate({ appliedOn: date })) {
      toast({ title: `Applied date updated.` });
    }
  };
  
  const handleOADueDateChange = React.useCallback(async (
    newDate?: Date,
    newTime?: string,
    newTimezone?: string
  ) => {
    const dateToUse = newDate || (application.oaDueDate ? new Date(application.oaDueDate) : null);
    const timeToUse = newTime ?? oaDueTime;
    const timezoneToUse = newTimezone ?? oaDueDateTimezone;
  
    if (!dateToUse || !timeToUse || !timezoneToUse) {
      return; 
    }
  
    const year = dateToUse.getFullYear();
    const month = (dateToUse.getMonth() + 1).toString().padStart(2, '0');
    const day = dateToUse.getDate().toString().padStart(2, '0');
    const [hours, minutes] = timeToUse.split(':');
  
    // Create the date by parsing it as UTC, which prevents the local browser timezone from interfering.
    const tempDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);
    
    // Create date strings for the same moment in time in both UTC and the target timezone.
    const utcDateString = tempDate.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzDateString = tempDate.toLocaleString('en-US', { timeZone: timezoneToUse });
    
    // The difference in milliseconds between these two representations is the timezone offset.
    const offset = (new Date(utcDateString)).getTime() - (new Date(tzDateString)).getTime();
    
    // We add the offset to our initial UTC time to get the correct final timestamp.
    // e.g., for 14:00 NY (UTC-4), offset is -4h. final = 14:00Z + (-4h) = 18:00Z.
    const finalTimestamp = tempDate.getTime() + offset;
    const finalDate = new Date(finalTimestamp);
  
    if (await handleUpdate({ oaDueDate: finalDate, oaDueDateTimezone: timezoneToUse })) {
      toast({ title: 'OA Due Date updated.' });
    }
  }, [application.oaDueDate, oaDueTime, oaDueDateTimezone, handleUpdate, toast]);
  

  const handleMarkOACompleted = async () => {
    const success = await handleUpdate({ oaCompletedOn: new Date() });
    if (success) {
      toast({ title: 'Online assessment marked as completed.' });
    }
  };

  const handleInterviewDateChange = async (date: Date | undefined, roundNumber: number) => {
    if (date) {
        const fieldName = `interviewDate${roundNumber}` as keyof Application;
        const success = await handleUpdate({ [fieldName]: date });
        if (success) {
            toast({ title: `Round ${roundNumber} date updated.` });
        }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApplication(application.id);
      toast({ title: 'Application deleted.' });
      setOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete application.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 bg-card">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
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

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                        id="jobTitle"
                        value={currentJobTitle}
                        onChange={(e) => setCurrentJobTitle(e.target.value)}
                        onBlur={handleJobTitleBlur}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                        id="companyName"
                        value={currentCompanyName}
                        onChange={(e) => setCurrentCompanyName(e.target.value)}
                        onBlur={handleCompanyNameBlur}
                    />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                    id="location"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    onBlur={handleLocationBlur}
                />
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{application.status}</Badge>
                    {application.status === 'Yet to Apply' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-500"
                                onClick={handleQuickApply}
                              >
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="sr-only">Mark as Applied</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as Applied</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    )}
                    <Badge variant="outline" className={cn("capitalize", categoryStyles[application.category])}>{application.category}</Badge>
                    {(application.workArrangement) && (
                      <Badge variant="outline" className={cn(workArrangementStyles[application.workArrangement])}>{application.workArrangement}</Badge>
                    )}
                    <Badge variant="outline" className={cn(applicationTypeStyles[application.type])}>{application.type}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Change type:</span>
                  <Select value={application.type} onValueChange={handleTypeChange}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                          {applicationTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Change category:</span>
                    <Select value={application.category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Change Arrangement:</span>
                    <Select value={application.workArrangement || 'On-site'} onValueChange={handleWorkArrangementChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select arrangement" />
                        </SelectTrigger>
                        <SelectContent>
                            {workArrangements.map(wa => (
                                <SelectItem key={wa} value={wa}>{wa}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isInterviewStage && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Interview Dates</h3>
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, index) => {
                    const fieldName = `interviewDate${index + 1}` as keyof Application;
                    const interviewDate = application[fieldName] as Date | null | undefined;
                    if (interviewDate) {
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <span className="font-medium w-24">Round {index + 1}:</span>
                           <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn("w-[240px] justify-start text-left font-normal")}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(new Date(interviewDate), "PPP")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={new Date(interviewDate)}
                                  onSelect={(date) => handleInterviewDateChange(date, index + 1)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                {(() => {
                  const nextRoundIndex = Array.from({ length: 10 }).findIndex((_, index) => {
                    const fieldName = `interviewDate${index + 1}` as keyof Application;
                    return !application[fieldName];
                  });

                  if (nextRoundIndex !== -1) {
                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Round {nextRoundIndex + 1}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            onSelect={(date) => {
                                handleInterviewDateChange(date, nextRoundIndex + 1)
                                const trigger = document.activeElement as HTMLElement;
                                if(trigger) trigger.blur();
                              }
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }
                  return <p className="text-sm text-muted-foreground">Maximum of 10 interview rounds reached.</p>;
                })()}
              </div>
            )}


            <div className="space-y-4">
                {!isInterviewStage && application.status !== 'Yet to Apply' && (
                  <div className="space-y-1">
                      <label className="text-sm font-medium">Applied On</label>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full justify-start text-left font-normal",
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
                              onSelect={handleAppliedOnChange}
                              initialFocus
                              />
                          </PopoverContent>
                      </Popover>
                  </div>
                )}
                {application.status === 'OA' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">OA Due Date</label>
                      <div className="flex gap-2 items-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !application.oaDueDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {application.oaDueDate ? format(new Date(application.oaDueDate), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={application.oaDueDate ? new Date(application.oaDueDate) : undefined}
                              onSelect={(date) => handleOADueDateChange(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                            type="time"
                            value={oaDueTime}
                            onChange={(e) => {
                              setOaDueTime(e.target.value);
                              handleOADueDateChange(undefined, e.target.value);
                            }}
                            className="w-[120px]"
                        />
                      </div>
                      <div className="pt-2">
                        <Select 
                          value={oaDueDateTimezone || ''}
                          onValueChange={(tz) => {
                            setOaDueDateTimezone(tz);
                            handleOADueDateChange(undefined, undefined, tz);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {timezones.map(tz => (
                              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {application.oaCompletedOn ? (
                        <div>
                            <label className="text-sm font-medium">OA Completion</label>
                            <p className="text-sm text-muted-foreground pt-2">
                              Completed {formatDistanceToNow(new Date(application.oaCompletedOn), { addSuffix: true })}
                            </p>
                        </div>
                      ) : (
                        <Button onClick={handleMarkOACompleted} variant="outline" size="sm">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </Button>
                      )}
                    </div>
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
              <Label htmlFor="resumeUrl" className="font-semibold">Resume</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="resumeUrl"
                  placeholder="Paste a link or note"
                  value={currentResumeUrl}
                  onChange={(e) => setCurrentResumeUrl(e.target.value)}
                  onBlur={handleResumeUrlBlur}
                />
                {application.resumeUrl ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClearResume}
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Clear Resume</span>
                    </Button>
                    {application.resumeUrl.startsWith('http') && (
                      <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0">
                        <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Open Link</span>
                        </a>
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            </div>

            {isInterviewStage && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  {application.appliedOn && (
                      <div className="space-y-1">
                          <label className="text-sm font-medium">Applied On</label>
                          <p className="text-sm text-muted-foreground">{format(new Date(application.appliedOn), "PPP")} ({formatDistanceToNow(new Date(application.appliedOn), { addSuffix: true })})</p>
                      </div>
                  )}
                  {application.oaCompletedOn && (
                      <div className="space-y-1">
                          <label className="text-sm font-medium">OA Completed On</label>
                          <p className="text-sm text-muted-foreground">{format(new Date(application.oaCompletedOn), "PPP")} ({formatDistanceToNow(new Date(application.oaCompletedOn), { addSuffix: true })})</p>
                      </div>
                  )}
                  {application.oaDueDate && (
                      <div className="space-y-1">
                          <label className="text-sm font-medium">OA Due Date</label>
                          <p className="text-sm text-muted-foreground">{format(new Date(application.oaDueDate), "PPP")} ({formatDistanceToNow(new Date(application.oaDueDate), { addSuffix: true })})</p>
                      </div>
                  )}
              </div>
            )}

            <div className="space-y-2">
                <h3 className="font-semibold">Job Description</h3>
                <ScrollArea className="h-48 rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">
                        {application.jobDescription || 'No job description was fetched for this application.'}
                    </p>
                </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 flex-shrink-0 border-t">
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
                  This action cannot be undone. This will permanently delete this application.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
