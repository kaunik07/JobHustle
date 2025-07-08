
'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileJson, Save, Download, FileWarning } from 'lucide-react';
import { saveLatexResume } from '@/app/actions';
import type { Resume, User } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const formSchema = z.object({
  name: z.string().min(1, 'Resume name is required'),
  latexContent: z.string().min(1, 'LaTeX content cannot be empty.'),
});

type FormValues = z.infer<typeof formSchema>;

interface LatexResumeEditorDialogProps {
  user: User;
  resume?: Resume;
  children?: React.ReactNode;
}

export function LatexResumeEditorDialog({ user, resume, children }: LatexResumeEditorDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  
  const isEditMode = !!resume;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: resume?.name || '',
      latexContent: resume?.latexContent || '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: resume?.name || '',
        latexContent: resume?.latexContent || '',
      });
    }
  }, [open, resume, form]);

  const handleDownloadTex = () => {
    const content = form.getValues('latexContent');
    const name = form.getValues('name') || 'resume';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/ /g, '_')}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await saveLatexResume({
        id: resume?.id,
        userId: user.id,
        ...values,
      });

      toast({
        title: isEditMode ? 'Resume Updated' : 'Resume Created',
        description: `Your LaTeX resume "${values.name}" has been saved.`,
      });
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save resume. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
            <Button variant="outline">
                <FileJson className="mr-2 h-4 w-4" /> Create LaTeX Resume
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit LaTeX Resume' : 'Create LaTeX Resume'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Editing "${resume.name}".` : 'Create a new resume using LaTeX code.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior LaTeX Resume" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="latexContent"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel>LaTeX Code</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="\documentclass{article}..."
                      className="flex-1 font-mono resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 border-t">
              <div className="flex justify-between w-full">
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleDownloadTex}>
                        <Download className="mr-2 h-4 w-4" /> Download .tex
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                    <Button type="button" variant="outline" disabled>
                                        <FileWarning className="mr-2 h-4 w-4" /> Compile to PDF
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>PDF compilation requires external tools not available here.</p>
                                <p>Download the .tex file and compile it on your local machine.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Resume
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
