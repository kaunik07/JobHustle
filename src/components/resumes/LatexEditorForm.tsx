
'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { Loader2, Save, Download, FileWarning, ArrowLeft } from 'lucide-react';
import { saveLatexResume, compileLatex } from '@/app/actions';
import type { Resume, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(1, 'Resume name is required'),
  latexContent: z.string().min(1, 'LaTeX content cannot be empty.'),
});

type FormValues = z.infer<typeof formSchema>;

interface LatexEditorFormProps {
  user: User;
  resume?: Resume;
}

export function LatexEditorForm({ user, resume }: LatexEditorFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCompiling, setIsCompiling] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const isEditMode = !!resume;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: resume?.name || '',
      latexContent: resume?.latexContent || '',
    },
  });

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
  
  const handleCompile = async () => {
    const content = form.getValues('latexContent');
    if (!content.trim()) {
        toast({ variant: 'destructive', title: 'Cannot compile empty content.' });
        return;
    }
    
    setIsCompiling(true);
    try {
        const result = await compileLatex(content);
        if ('error' in result) {
            toast({ variant: 'destructive', title: 'Compilation Failed', description: result.error, duration: 8000 });
        } else {
            const name = form.getValues('name') || 'resume';
            const link = document.createElement('a');
            link.href = `data:application/pdf;base64,${result.pdfBase64}`;
            link.download = `${name.replace(/ /g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: 'Compilation Successful', description: 'Your PDF download has started.' });
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
        setIsCompiling(false);
    }
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
      // Programmatically create a query string for the redirect
      const params = new URLSearchParams();
      params.set('user', user.id);
      params.set('view', 'resumes');
      router.push(`/?${params.toString()}`);
      router.refresh(); 
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
    <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <Button variant="ghost" size="sm" className="mb-4 w-fit -ml-2" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <CardTitle>{isEditMode ? 'Edit LaTeX Resume' : 'Create New LaTeX Resume'}</CardTitle>
            <CardDescription>
                {isEditMode ? `Editing "${resume.name}".` : 'Create a new resume using LaTeX code.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <FormItem className="flex flex-col">
                    <FormLabel>LaTeX Code</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="\\documentclass{article}..."
                        className="font-mono resize-y min-h-[500px]"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="flex justify-between w-full pt-4 border-t">
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleDownloadTex}>
                            <Download className="mr-2 h-4 w-4" /> Download .tex
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCompile} disabled={isCompiling}>
                            {isCompiling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileWarning className="mr-2 h-4 w-4" />}
                            Compile to PDF
                        </Button>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Resume
                    </Button>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
