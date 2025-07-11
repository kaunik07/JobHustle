
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type Application, type ApplicationStatus, statuses, categories, type ApplicationCategory, type User, applicationTypes, type ApplicationType, workArrangements, type ApplicationWorkArrangement, type Resume } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Trash2, CalendarIcon, CheckCircle2, Plus, FileText, Check, Sparkles, Loader2, RefreshCw, X, FileJson, Pencil, Copy, FilePlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, formatDistanceToNow, startOfDay } from 'date-fns';
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
import { Switch } from '@/components/ui/switch';
import { updateApplication, deleteApplication, reevaluateScores, reevaluateAiAnalysis, createLatexResumeForApplication, copyLatexResumeForApplication, detachLatexResume } from '@/app/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';

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
  const [isReevaluatingScores, setIsReevaluatingScores] = React.useState(false);
  const [isReevaluatingAnalysis, setIsReevaluatingAnalysis] = React.useState(false);
  const [isManagingLatex, setIsManagingLatex] = React.useState<string | boolean>(false); // Can be a resume ID for copy action
  const router = useRouter();
  
  const companyDomain = application.companyName.toLowerCase().replace(/[^a-z0-9]/gi, '') + '.com';
  
  const [currentNotes, setCurrentNotes] = React.useState(application.notes || '');
  const [currentJobTitle, setCurrentJobTitle] = React.useState(application.jobTitle);
  const [currentCompanyName, setCurrentCompanyName] = React.useState(application.companyName);
  const [currentLocations, setCurrentLocations] = React.useState(application.locations);
  const [locationInput, setLocationInput] = React.useState('');
  const [currentOaSkipped, setCurrentOaSkipped] = React.useState(application.oaSkipped);
  const [currentJobDescription, setCurrentJobDescription] = React.useState(application.jobDescription || '');

  // State for OA date/time
  const [oaDueTime, setOaDueTime] = React.useState('23:59');
  const [oaDueDateTimezone, setOaDueDateTimezone] = React.useState<string | null>(null);

  // State for Interview dates/times
  const [interviewDetails, setInterviewDetails] = React.useState<Record<number, { time: string; timezone: string | null }>>({});
  
  const [timezones, setTimezones] = React.useState<string[]>([]);
  const isInterviewStage = application.status === 'Interview';

  const userResumes = React.useMemo(() => {
    if (application.user?.resumes && application.user.resumes.length > 0) {
        return application.user.resumes;
    }
    // Fallback for cases where `user.resumes` might not be populated
    if (application.resumeScores && application.resumeScores.length > 0) {
        const resumesFromScores = application.resumeScores.map(s => ({
            id: s.resumeId,
            name: s.resume.name,
            createdAt: s.resume.createdAt,
            // These fields are not available here but are not essential for the dropdown
            resumeText: '',
            userId: application.userId,
        }));
        const uniqueResumes = Array.from(new Map(resumesFromScores.map(r => [r.id, r])).values());
        return uniqueResumes as Resume[];
    }
    return [];
  }, [application.user?.resumes, application.resumeScores, application.userId]);
  
  const userLatexResumes = React.useMemo(() => {
      return userResumes.filter(r => r.latexContent);
  }, [userResumes]);


  React.useEffect(() => {
    // This runs on client only and avoids hydration errors
    setTimezones(Intl.supportedValuesOf('timeZone'));
  }, []);

  React.useEffect(() => {
    if (open) {
      setCurrentJobTitle(application.jobTitle);
      setCurrentCompanyName(application.companyName);
      setCurrentLocations(application.locations);
      setLocationInput('');
      setCurrentNotes(application.notes || '');
      setCurrentOaSkipped(application.oaSkipped);
      setCurrentJobDescription(application.jobDescription || '');
      
      const initialTimezone = application.oaDueDateTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      setOaDueDateTimezone(initialTimezone);

      if (application.oaDueDate) {
          try {
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

      const initialInterviewDetails: Record<number, { time: string; timezone: string | null }> = {};
      for (let i = 1; i <= 10; i++) {
        const date = application[`interviewDate${i}` as keyof Application] as Date | null;
        const timezone = application[`interviewDateTimezone${i}` as keyof Application] as string | null;
        if (date) {
            const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            let time = '12:00';
            try {
                const timeFormatter = new Intl.DateTimeFormat('en-GB', {
                    timeZone: tz,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
                time = timeFormatter.format(new Date(date));
            } catch (e) {
                console.error("Invalid timezone, falling back", e);
                time = format(new Date(date), 'HH:mm');
            }
            initialInterviewDetails[i] = { time, timezone: tz };
        }
      }
      setInterviewDetails(initialInterviewDetails);
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

  const handleUpdateLocations = async (newLocations: string[]) => {
    if (newLocations.length === 0) {
      toast({ variant: 'destructive', title: 'At least one location is required.' });
      return;
    }
    if (await handleUpdate({ locations: newLocations })) {
      setCurrentLocations(newLocations);
      toast({ title: 'Locations updated.' });
    }
  };
  
  const handleRemoveLocation = (locationToRemove: string) => {
    const newLocations = currentLocations.filter(loc => loc !== locationToRemove);
    handleUpdateLocations(newLocations);
  };
  
  const handleAddLocation = () => {
    const trimmedInput = locationInput.trim();
    if (trimmedInput && !currentLocations.some(loc => loc.toLowerCase() === trimmedInput.toLowerCase())) {
      const newLocations = [...currentLocations, trimmedInput];
      handleUpdateLocations(newLocations);
      setLocationInput('');
    } else if (trimmedInput) {
      toast({ variant: 'destructive', title: 'Location already exists.' });
    }
  };
  
  const handleLocationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLocation();
    }
  };

  const handleNotesBlur = async () => {
    if (currentNotes !== (application.notes || '')) {
      if (await handleUpdate({ notes: currentNotes })) {
        toast({ title: "Notes updated." });
      }
    }
  };

  const handleJobDescriptionBlur = async () => {
    if (currentJobDescription !== (application.jobDescription || '')) {
      if (await handleUpdate({ jobDescription: currentJobDescription })) {
        toast({ title: "Job description updated." });
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
  
  const handleOaSkippedChange = async (skipped: boolean) => {
    const success = await handleUpdate({ oaSkipped: skipped });
    if (success) {
      setCurrentOaSkipped(skipped);
      toast({ title: `OA Skipped status updated.` });
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
  
  const handleResumeChange = async (newResumeId: string) => {
    const resumeIdToUpdate = newResumeId === "none" ? null : newResumeId;
    if (await handleUpdate({ resumeId: resumeIdToUpdate })) {
      const resumeName = userResumes.find(r => r.id === newResumeId)?.name || "None";
      toast({ title: `Resume updated to "${resumeName}".` });
    }
  };

  const handleAppliedOnChange = async (date: Date | undefined) => {
    if (await handleUpdate({ appliedOn: date })) {
      toast({ title: `Applied date updated.` });
    }
  };

  const handleApplyByDateChange = async (date: Date | undefined) => {
    if (await handleUpdate({ applyByDate: date })) {
      toast({ title: `Last date to apply updated.` });
    }
  };
  
  const handleOADueDateChange = React.useCallback(async (
    newDate?: Date,
    newTime?: string,
    newTimezone?: string
  ) => {
    const dateToUse = newDate || (application.oaDueDate ? new Date(application.oaDueDate) : null);
    
    if (application.appliedOn && dateToUse && startOfDay(dateToUse) < startOfDay(new Date(application.appliedOn))) {
      toast({
        variant: 'destructive',
        title: 'Invalid Date',
        description: 'OA due date cannot be before the application date.',
      });
      return;
    }

    const timeToUse = newTime ?? oaDueTime;
    const timezoneToUse = newTimezone ?? oaDueDateTimezone;
  
    if (!dateToUse || !timeToUse || !timezoneToUse) {
      return; 
    }
  
    const year = dateToUse.getFullYear();
    const month = (dateToUse.getMonth() + 1).toString().padStart(2, '0');
    const day = dateToUse.getDate().toString().padStart(2, '0');
    const [hours, minutes] = timeToUse.split(':');
  
    const tempDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);
    
    const utcDateString = tempDate.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzDateString = tempDate.toLocaleString('en-US', { timeZone: timezoneToUse });
    
    const offset = (new Date(utcDateString)).getTime() - (new Date(tzDateString)).getTime();
    
    const finalTimestamp = tempDate.getTime() + offset;
    const finalDate = new Date(finalTimestamp);
  
    if (await handleUpdate({ oaDueDate: finalDate, oaDueDateTimezone: timezoneToUse })) {
      toast({ title: 'OA Due Date updated.' });
    }
  }, [application.oaDueDate, application.appliedOn, oaDueTime, oaDueDateTimezone, handleUpdate, toast]);
  

  const handleMarkOACompleted = async () => {
    const success = await handleUpdate({ oaCompletedOn: new Date() });
    if (success) {
      toast({ title: 'Online assessment marked as completed.' });
    }
  };

  const handleInterviewDateChange = async (
      roundNumber: number,
      update: { date?: Date; time?: string; timezone?: string }
  ) => {
      const fieldNameDate = `interviewDate${roundNumber}` as keyof Application;
      const fieldNameTimezone = `interviewDateTimezone${roundNumber}` as keyof Application;
      const existingDate = application[fieldNameDate] as Date | null;
      if (!existingDate && !update.date) return; // Can't update without a date

      const dateToUse = update.date || new Date(existingDate!);
      const currentRoundDetails = interviewDetails[roundNumber] || { time: '12:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      const timeToUse = update.time ?? currentRoundDetails.time;
      const timezoneToUse = update.timezone ?? currentRoundDetails.timezone!;
      if (!dateToUse || !timeToUse || !timezoneToUse) return;

      const year = dateToUse.getFullYear();
      const month = (dateToUse.getMonth() + 1).toString().padStart(2, '0');
      const day = dateToUse.getDate().toString().padStart(2, '0');
      const [hours, minutes] = timeToUse.split(':');
      const tempDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);
      const utcDateString = tempDate.toLocaleString('en-US', { timeZone: 'UTC' });
      const tzDateString = tempDate.toLocaleString('en-US', { timeZone: timezoneToUse });
      const offset = (new Date(utcDateString)).getTime() - (new Date(tzDateString)).getTime();
      const finalDate = new Date(tempDate.getTime() + offset);

      const success = await handleUpdate({
          [fieldNameDate]: finalDate,
          [fieldNameTimezone]: timezoneToUse,
      } as Partial<Application>);
      
      if (success) {
          toast({ title: `Round ${roundNumber} updated.` });
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
  
  const handleReevaluateScores = async () => {
    if (!application.jobDescription) {
        toast({ variant: 'destructive', title: 'Cannot Re-evaluate', description: 'A job description is required to score resumes.' });
        return;
    }
    setIsReevaluatingScores(true);
    try {
      await reevaluateScores(application.id);
      toast({ title: "Re-evaluation complete", description: "The resume scores have been updated." });
      router.refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Re-evaluation Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
      setIsReevaluatingScores(false);
    }
  };

  const handleReevaluateAnalysis = async () => {
    if (!application.jobDescription) {
        toast({ variant: 'destructive', title: 'Cannot Re-evaluate', description: 'A job description is required for AI analysis.' });
        return;
    }
    setIsReevaluatingAnalysis(true);
    try {
      await reevaluateAiAnalysis(application.id);
      toast({ title: "Re-evaluation complete", description: "AI analysis has been updated." });
      router.refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'AI Analysis Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
    } finally {
      setIsReevaluatingAnalysis(false);
    }
  };

  const handleCreateNewLatexResume = async () => {
    setIsManagingLatex('create');
    try {
      const newResumeId = await createLatexResumeForApplication(application.id, application.userId);
      toast({ title: 'New resume created and linked.' });
      router.push(`/resumes/edit-latex/${newResumeId}?user=${application.userId}`);
      setOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to create resume.', description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsManagingLatex(false);
    }
  };

  const handleCopyLatexResume = async (resumeId: string) => {
    setIsManagingLatex(resumeId);
    try {
      const newResumeId = await copyLatexResumeForApplication(resumeId, application.id, application.userId);
      toast({ title: 'Resume copied and linked.' });
      router.push(`/resumes/edit-latex/${newResumeId}?user=${application.userId}`);
      setOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to copy resume.', description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsManagingLatex(false);
    }
  };

  const handleDetachLatexResume = async () => {
    setIsManagingLatex('detach');
    try {
      await detachLatexResume(application.id);
      toast({ title: 'Resume detached.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to detach resume.', description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsManagingLatex(false);
    }
  };

  const formatDateTime = (date: Date | null | undefined, timezone: string | null | undefined) => {
    if (!date) return 'N/A';
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
        const formatted = new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: tz,
            timeZoneName: 'short'
        });
        return `${formatted} (${formatDistanceToNow(new Date(date), { addSuffix: true })})`;
    } catch {
        return `${format(new Date(date), "PPP, p")} (${formatDistanceToNow(new Date(date), { addSuffix: true })})`;
    }
  }

  const showOaSkipToggle = !['Yet to Apply', 'OA'].includes(application.status);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 flex-shrink-0 border-b">
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
              <SheetTitle className="text-2xl font-bold">{application.jobTitle}</SheetTitle>
              <SheetDescription className="text-lg">
                at {application.companyName}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

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
              <Label>Locations</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border p-2 min-h-[40px]">
                {currentLocations.map((loc) => (
                  <Badge key={loc} variant="secondary">
                    {loc}
                    <button
                      className="ml-1 rounded-full p-0.5 hover:bg-background/50"
                      onClick={() => handleRemoveLocation(loc)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a location..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={handleLocationInputKeyDown}
                />
                <Button variant="outline" onClick={handleAddLocation}>
                  Add
                </Button>
              </div>
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
                    {application.isUsCitizenOnly && <Badge variant="destructive">US Citizen</Badge>}
                    {application.sponsorshipNotOffered && <Badge variant="destructive">No Sponsorship</Badge>}
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
                {showOaSkipToggle && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="oa-skipped"
                      checked={currentOaSkipped}
                      onCheckedChange={handleOaSkippedChange}
                    />
                    <Label htmlFor="oa-skipped">OA Skipped</Label>
                  </div>
                )}
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
                    const roundNumber = index + 1;
                    const fieldName = `interviewDate${roundNumber}` as keyof Application;
                    const interviewDate = application[fieldName] as Date | null | undefined;
                    const roundDetails = interviewDetails[roundNumber];

                    if (interviewDate && roundDetails) {
                      return (
                        <div key={index} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2">
                          <span className="font-medium w-24">Round {roundNumber}:</span>
                           <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn("justify-start text-left font-normal")}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(new Date(interviewDate), "PPP")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={new Date(interviewDate)}
                                  onSelect={(date) => handleInterviewDateChange(roundNumber, { date })}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Input
                                type="time"
                                value={roundDetails.time}
                                onChange={(e) => {
                                    setInterviewDetails(prev => ({...prev, [roundNumber]: {...prev[roundNumber], time: e.target.value}}));
                                    handleInterviewDateChange(roundNumber, { time: e.target.value });
                                }}
                                className="w-[120px]"
                            />
                            <Select 
                              value={roundDetails.timezone || ''}
                              onValueChange={(tz) => {
                                setInterviewDetails(prev => ({...prev, [roundNumber]: {...prev[roundNumber], timezone: tz}}));
                                handleInterviewDateChange(roundNumber, { timezone: tz });
                              }}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {timezones.map(tz => (
                                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                                if (date) {
                                    handleInterviewDateChange(nextRoundIndex + 1, { date: date, time: '12:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
                                    const trigger = document.activeElement as HTMLElement;
                                    if(trigger) trigger.blur();
                                }
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
                 {application.status === 'Yet to Apply' && (
                  <div className="space-y-1">
                    <Label>Last Date to Apply</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !application.applyByDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {application.applyByDate ? format(new Date(application.applyByDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={application.applyByDate ? new Date(application.applyByDate) : undefined}
                          onSelect={handleApplyByDateChange}
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
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-semibold">Latex Resume</h3>
              <div className="rounded-lg border p-4 space-y-4">
                {application.customLatexResume ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-5 w-5 text-primary" />
                      <span className="font-medium">{application.customLatexResume.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleCopyLatexResume(application.customLatexResume!.id)} disabled={isManagingLatex === application.customLatexResume!.id}>
                        {isManagingLatex === application.customLatexResume!.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                        Copy & Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/resumes/edit-latex/${application.latexResumeId}?user=${application.userId}`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDetachLatexResume} disabled={isManagingLatex === 'detach'}>
                        {isManagingLatex === 'detach' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Detach
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">No custom LaTeX resume linked. Create a new one or copy an existing one to tailor it for this application.</p>
                     <Button size="sm" onClick={handleCreateNewLatexResume} disabled={!!isManagingLatex}>
                      {isManagingLatex === 'create' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
                      Create New Blank Resume
                    </Button>
                    {userLatexResumes.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium">Existing Resume:</p>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                          {userLatexResumes.map(resume => (
                            <div key={resume.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                                <span className="text-sm">{resume.name}</span>
                                <Button size="sm" variant="outline" onClick={() => handleCopyLatexResume(resume.id)} disabled={!!isManagingLatex}>
                                    {isManagingLatex === resume.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                                    Copy & Edit
                                </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
                <h3 className="font-semibold">Attach PDF Resume (for AI Scoring)</h3>
                {userResumes.filter(r => r.resumeText).length > 0 ? (
                    <Select onValueChange={handleResumeChange} value={application.resumeId || "none"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a resume" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None (detach)</SelectItem>
                            {userResumes.filter(r => r.resumeText).map(resume => (
                                <SelectItem key={resume.id} value={resume.id}>
                                    {resume.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <p className="text-sm text-muted-foreground">This user has no PDF resumes uploaded.</p>
                )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Resume-to-Job Score</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReevaluateScores}
                        disabled={isReevaluatingScores || !application.jobDescription}
                        className="h-7 w-7"
                      >
                        {isReevaluatingScores ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="sr-only">Re-evaluate Scores</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{!application.jobDescription ? "Add a job description to enable evaluation" : "Re-evaluate all resumes"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {(application.resumeScores && application.resumeScores.length > 0) ? (
                <div className="space-y-1 rounded-lg border p-1">
                  {application.resumeScores
                    .sort((a, b) => b.score - a.score) // Sort by score descending
                    .map((score) => (
                    <div key={score.id} className="flex flex-col gap-1 rounded-md p-2 hover:bg-secondary">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div className="text-sm font-medium">{score.resume.name}</div>
                                <Badge variant="secondary" className="flex items-center gap-1.5 cursor-default">
                                    <Sparkles className="h-3 w-3 text-yellow-400" />
                                    {score.score}
                                </Badge>
                            </div>
                            {application.resumeId === score.resumeId ? (
                            <Button variant="outline" size="sm" disabled>
                                <Check className="mr-2 h-4 w-4" />
                                Attached
                            </Button>
                            ) : (
                            <Button variant="outline" size="sm" onClick={() => handleResumeChange(score.resumeId)}>
                                Attach
                            </Button>
                            )}
                        </div>
                        <p
                          className="pl-8 text-xs text-muted-foreground [&>strong]:font-semibold [&>strong]:text-foreground/90"
                          dangerouslySetInnerHTML={{ __html: score.summary }}
                        />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No resume scores available. This might be because no job description was provided or the user has no resumes uploaded.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">AI Analysis & Keywords</h3>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleReevaluateAnalysis}
                                    disabled={isReevaluatingAnalysis || !application.jobDescription}
                                    className="h-7 w-7"
                                >
                                    {isReevaluatingAnalysis ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Re-evaluate AI Analysis</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{!application.jobDescription ? "Add a job description to enable analysis" : "Re-run all AI analysis"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {application.keywords && application.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {application.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">{keyword}</Badge>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            No keywords extracted. Add a job description and try re-evaluating.
                        </p>
                    </div>
                )}
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
                          <p className="text-sm text-muted-foreground">{formatDateTime(application.oaDueDate, application.oaDueDateTimezone)}</p>
                      </div>
                  )}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold">Job Description</h3>
              {application.status === 'Yet to Apply' ? (
                <Textarea
                  placeholder="Paste the job description here. It will be analyzed when the application is saved."
                  value={currentJobDescription}
                  onChange={(e) => setCurrentJobDescription(e.target.value)}
                  onBlur={handleJobDescriptionBlur}
                  className="min-h-[192px] text-sm"
                />
              ) : (
                <ScrollArea className="h-48 rounded-md border p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {application.jobDescription || 'No job description was provided for this application.'}
                  </p>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 pt-4 flex-shrink-0 border-t">
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
