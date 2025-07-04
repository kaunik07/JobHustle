
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Paperclip, Upload, Link } from 'lucide-react';
import { bulkAddApplications, bulkAddApplicationsFromUrls } from '@/app/actions';
import Papa from 'papaparse';
import { Input } from '../ui/input';
import { applicationTypes, categories, workArrangements } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

const requiredHeaders = [
  'companyName',
  'jobTitle',
  'location',
  'jobUrl',
  'type',
  'category',
];

export function BulkAddDialog() {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  // For CSV
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // For URLs
  const [urls, setUrls] = React.useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };

  const handleCsvSubmit = () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }

    setIsSubmitting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const headers = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          toast({
            variant: 'destructive',
            title: 'Invalid CSV Format',
            description: `Missing required headers: ${missingHeaders.join(', ')}`,
          });
          setIsSubmitting(false);
          return;
        }

        const applications = results.data as any[];

        try {
          await bulkAddApplications(applications);
          toast({
            title: 'Upload Successful',
            description: `${applications.length} application entries have been processed and added for all users.`,
          });
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setOpen(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white whitespace-pre-wrap">{errorMessage}</code></pre>,
            });
        } finally {
          setIsSubmitting(false);
        }
      },
      error: (error) => {
        toast({
          variant: 'destructive',
          title: 'CSV Parsing Error',
          description: error.message,
        });
        setIsSubmitting(false);
      },
    });
  };
  
  const handleUrlSubmit = async () => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urlList.length === 0) {
        toast({ variant: 'destructive', title: 'No URLs provided' });
        return;
    }

    setIsSubmitting(true);
    try {
        const result = await bulkAddApplicationsFromUrls(urlList);
        toast({
            title: 'Processing Complete',
            description: `${result.successCount} applications added successfully. ${result.failedCount > 0 ? `${result.failedCount} failed.` : ''}`,
        });
        setUrls('');
        setOpen(false);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({
            variant: 'destructive',
            title: 'URL Processing Failed',
            description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white whitespace-pre-wrap">{errorMessage}</code></pre>,
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Paperclip className="mr-2" />
          Bulk Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle>Bulk Add Applications</DialogTitle>
          <DialogDescription>
            Use AI to add jobs from a list of URLs, or upload a CSV file with application data.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="urls" className="flex-1 flex flex-col min-h-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="urls">From URLs</TabsTrigger>
                <TabsTrigger value="csv">From CSV</TabsTrigger>
            </TabsList>
            
            <TabsContent value="urls" className="flex-1 flex flex-col mt-4 space-y-4">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="urls-textarea">Job Posting URLs</Label>
                            <Textarea
                                id="urls-textarea"
                                placeholder="Paste one URL per line..."
                                className="min-h-[150px]"
                                value={urls}
                                onChange={(e) => setUrls(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 text-sm">
                            <h4 className="font-semibold">How it Works</h4>
                            <p className="text-muted-foreground">The AI will visit each URL, extract job details, and create an application entry for all users with the status "Yet to Apply".</p>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-auto">
                    <Button onClick={handleUrlSubmit} disabled={!urls.trim() || isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link className="w-4 h-4 mr-2" />}
                        Add Applications from URLs
                    </Button>
                </DialogFooter>
            </TabsContent>

            <TabsContent value="csv" className="flex-1 flex flex-col mt-4 space-y-4">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4">
                        <div
                        className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-10 h-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">CSV up to 10MB</p>
                            {file && (
                                <p className="mt-2 text-sm font-medium text-foreground">
                                Selected file: {file.name}
                                </p>
                            )}
                            <Input
                                ref={fileInputRef}
                                id="file-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="space-y-2 text-sm">
                            <h4 className="font-semibold">CSV Format Guide</h4>
                            <p className="text-muted-foreground">Your CSV must include the following headers. Each application will be added for <strong>all users</strong> in the system with its status automatically set to <strong>"Yet to Apply"</strong>.</p>
                            <ul className="pl-5 space-y-1 list-disc text-muted-foreground">
                                <li><strong>companyName</strong>: The name of the company.</li>
                                <li><strong>jobTitle</strong>: The job position.</li>
                                <li><strong>location</strong>: The job location.</li>
                                <li><strong>jobUrl</strong>: The URL to the job posting.</li>
                                <li><strong>type</strong>: Must be one of: <code className="bg-muted px-1 rounded">{applicationTypes.join(', ')}</code>.</li>
                                <li><strong>category</strong>: Must be one of: <code className="bg-muted px-1 rounded">{categories.join(', ')}</code>.</li>
                                <li><strong>workArrangement</strong> (optional): Can be one of: <code className="bg-muted px-1 rounded">{workArrangements.join(', ')}</code>.</li>
                                <li><strong>jobDescription</strong> (optional): Text of the job description.</li>
                                <li><strong>notes</strong> (optional): Any notes for the application.</li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-auto">
                    <Button onClick={handleCsvSubmit} disabled={!file || isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload and Add Applications
                    </Button>
                </DialogFooter>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
