
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
import { type Application, type ApplicationStatus, statuses, categories, type ApplicationCategory, type User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Trash2, CalendarIcon, Paperclip, FileText, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
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
import { updateApplication, deleteApplication, attachResume, removeResume } from '@/app/actions';

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


export function ApplicationDetailsDialog({ application, children }: ApplicationDetailsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const companyDomain = application.companyName.toLowerCase().replace(/[^a-z0-9]/gi, '') + '.com';
  
  const [isUploading, setIsUploading] = React.useState(false);
  const [currentNotes, setCurrentNotes] = React.useState(application.notes || '');
  const [currentJobTitle, setCurrentJobTitle] = React.useState(application.jobTitle);
  const [currentCompanyName, setCurrentCompanyName] = React.useState(application.companyName);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setCurrentJobTitle(application.jobTitle);
      setCurrentCompanyName(application.companyName);
      setCurrentNotes(application.notes || '');
      setIsUploading(false);
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
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !application.user) {
        toast({ variant: 'destructive', title: 'User context is required to upload a resume.' });
        return;
    };

    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        try {
            const base64Content = (reader.result as string).split(',')[1];
            if (!base64Content) {
                toast({ variant: 'destructive', title: 'Could not read file.' });
                return;
            }

            await attachResume(
                application.id,
                { name: file.name, type: file.type, content: base64Content },
                application.user as User,
                application.companyName
            );
            toast({ title: 'Resume attached successfully.' });
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({ variant: 'destructive', title: 'Failed to attach resume.', description: errorMessage });
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };
    reader.onerror = () => {
        setIsUploading(false);
        toast({ variant: 'destructive', title: 'Error reading file.' });
    };
  };

  const handleDeleteResume = async () => {
    try {
      await removeResume(application.id);
      toast({ title: 'Resume removed.' });
    } catch (error) {
       console.error(error);
       toast({ variant: 'destructive', title: 'Failed to remove resume.' });
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
  
  const handleCategoryChange = async (newCategory: ApplicationCategory) => {
    if (await handleUpdate({ category: newCategory })) {
      toast({ title: `Category changed to ${newCategory}.` });
    }
  };

  const handleDateChange = async (date: Date | undefined, field: 'appliedOn' | 'dueDate') => {
    if (date) {
      if (await handleUpdate({ [field]: date })) {
        toast({ title: `${field === 'appliedOn' ? 'Applied date' : 'Due date'} updated.` });
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 bg-card">
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
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{application.status}</Badge>
                    <Badge variant="outline" className={cn("capitalize", categoryStyles[application.category])}>{application.category}</Badge>
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
                <div className="flex items-center gap-2">
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
                <h3 className="font-semibold">Resume</h3>
                {application.resumeUrl ? (
                    <div className="flex items-center justify-between rounded-md border p-2 pl-3">
                        <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary font-medium overflow-hidden">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={application.companyName + ' Resume'}>
                                View Resume in Drive
                            </span>
                        </a>
                        <div className="flex items-center gap-1">
                             <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Replace
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove the resume from your Google Drive and detach it from this application. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteResume}>
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                        </div>
                    </div>
                ) : (
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Paperclip className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Uploading...' : 'Attach Resume'}
                    </Button>
                )}
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    disabled={isUploading}
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
                  This action cannot be undone. This will permanently delete this application and its associated resume from Google Drive.
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
