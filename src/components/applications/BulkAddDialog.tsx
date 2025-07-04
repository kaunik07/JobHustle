
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
import { z } from 'zod';

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

  // For Filled Form CSV
  const [filledCsvFile, setFilledCsvFile] = React.useState<File | null>(null);
  const filledCsvFileInputRef = React.useRef<HTMLInputElement>(null);

  // For URL CSV
  const [urlCsvFile, setUrlCsvFile] = React.useState<File | null>(null);
  const urlCsvFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilledCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFilledCsvFile(event.target.files[0]);
    }
  };
  
  const handleUrlCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setUrlCsvFile(event.target.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setter(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };

  const handleFilledCsvSubmit = () => {
    if (!filledCsvFile) {
      toast({ variant: 'destructive', title: 'No file selected' });
      return;
    }

    setIsSubmitting(true);
    Papa.parse(filledCsvFile, {
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
          setFilledCsvFile(null);
          if (filledCsvFileInputRef.current) {
            filledCsvFileInputRef.current.value = '';
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
  
  const handleUrlCsvSubmit = async () => {
    if (!urlCsvFile) {
        toast({ variant: 'destructive', title: 'No URL CSV file selected' });
        return;
    }

    setIsSubmitting(true);
    
    Papa.parse(urlCsvFile, {
        skipEmptyLines: true,
        complete: async (results) => {
            const urlList = (results.data as string[][])
                .map(row => row[0]) // Get the first column
                .map(url => url?.trim())
                .filter(url => url && z.string().url().safeParse(url).success);

            if (urlList.length === 0) {
                toast({ variant: 'destructive', title: 'No valid URLs found in the CSV file.' });
                setIsSubmitting(false);
                return;
            }

            try {
                const result = await bulkAddApplicationsFromUrls(urlList);
                toast({
                    title: 'Processing Complete',
                    description: `${result.successCount} applications added successfully. ${result.failedCount > 0 ? `${result.failedCount} failed.` : ''}`,
                });
                setUrlCsvFile(null);
                 if (urlCsvFileInputRef.current) {
                    urlCsvFileInputRef.current.value = '';
                }
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
            Use AI to add jobs from a CSV of URLs, or upload a CSV with pre-filled application data.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="urls" className="flex-1 flex flex-col min-h-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="urls">URL CSV</TabsTrigger>
                <TabsTrigger value="csv">Filled form CSV</TabsTrigger>
            </TabsList>
            
            <TabsContent value="urls" className="flex-1 flex flex-col mt-4 space-y-4">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4">
                        <div
                          className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop(setUrlCsvFile)}
                          onClick={() => urlCsvFileInputRef.current?.click()}
                        >
                            <Upload className="w-10 h-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">CSV file with URLs</p>
                            {urlCsvFile && (
                                <p className="mt-2 text-sm font-medium text-foreground">
                                Selected file: {urlCsvFile.name}
                                </p>
                            )}
                            <Input
                                ref={urlCsvFileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleUrlCsvFileChange}
                            />
                        </div>
                        <div className="space-y-2 text-sm">
                            <h4 className="font-semibold">How it Works</h4>
                            <p className="text-muted-foreground">
                                Upload a CSV file containing one job posting URL per row in the first column. The AI will visit each URL, extract job details, and create an application entry for all users with the status "Yet to Apply".
                            </p>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-4 border-t mt-auto">
                    <Button onClick={handleUrlCsvSubmit} disabled={!urlCsvFile || isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link className="w-4 h-4 mr-2" />}
                        Add from URL CSV
                    </Button>
                </DialogFooter>
            </TabsContent>

            <TabsContent value="csv" className="flex-1 flex flex-col mt-4 space-y-4">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4">
                        <div
                        className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop(setFilledCsvFile)}
                        onClick={() => filledCsvFileInputRef.current?.click()}
                        >
                            <Upload className="w-10 h-10 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">CSV up to 10MB</p>
                            {filledCsvFile && (
                                <p className="mt-2 text-sm font-medium text-foreground">
                                Selected file: {filledCsvFile.name}
                                </p>
                            )}
                            <Input
                                ref={filledCsvFileInputRef}
                                id="file-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFilledCsvFileChange}
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
                    <Button onClick={handleFilledCsvSubmit} disabled={!filledCsvFile || isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Add from Filled CSV
                    </Button>
                </DialogFooter>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
