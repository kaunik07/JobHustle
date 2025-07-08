
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Download, FileWarning, ArrowLeft, Eye } from 'lucide-react';
import { saveLatexResume, compileLatex } from '@/app/actions';
import type { Resume, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import Editor from '@monaco-editor/react';

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
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const isEditMode = !!resume;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: resume?.name || '',
      latexContent: resume?.latexContent || `\\documentclass{article}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\author{${user.firstName} ${user.lastName}}
\\title{Resume for ...}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Contact}
Email: ${user.email}

\\section{Education}

\\section{Experience}

\\section{Projects}

\\section{Skills}

\\end{document}
`,
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
    setPdfPreviewUrl(null);
    try {
        const result = await compileLatex(content);
        if ('error' in result) {
            toast({ variant: 'destructive', title: 'Compilation Failed', description: result.error, duration: 8000 });
        } else {
            setPdfPreviewUrl(`data:application/pdf;base64,${result.pdfBase64}`);
            toast({ title: 'Compilation Successful', description: 'PDF preview has been updated.' });
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
        setIsCompiling(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfPreviewUrl) {
      toast({ variant: 'destructive', title: 'No PDF to download', description: 'Please compile the resume first.' });
      return;
    }
    const name = form.getValues('name') || 'resume';
    const link = document.createElement('a');
    link.href = pdfPreviewUrl;
    link.download = `${name.replace(/ /g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      router.push(`/?${params.toString()}&view=resumes`);
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
    <Card className="max-w-screen-xl mx-auto">
        <CardHeader>
            <Button variant="ghost" size="sm" className="mb-4 w-fit -ml-2" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <CardTitle>{isEditMode ? 'Edit LaTeX Resume' : 'Create New LaTeX Resume'}</CardTitle>
            <CardDescription>
                {isEditMode ? `Editing "${resume?.name}".` : 'Create a new resume using LaTeX code.'} Use the preview panel to see your compiled PDF.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-wrap gap-4 items-center justify-between w-full pb-6 border-b mb-6">
                    <div className="flex gap-2 flex-wrap">
                        <Button type="button" variant="outline" onClick={handleDownloadTex}>
                            <Download className="mr-2 h-4 w-4" /> Download .tex file
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleCompile} disabled={isCompiling}>
                            {isCompiling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                            Compile & Preview
                        </Button>
                         {pdfPreviewUrl && (
                            <Button type="button" variant="outline" onClick={handleDownloadPdf}>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                            </Button>
                        )}
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Resume
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Editor */}
                  <div className="space-y-6">
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
                          <FormItem className="flex flex-col h-full">
                            <FormLabel>LaTeX Code</FormLabel>
                            <FormControl>
                              <div className="rounded-md border h-[500px] lg:h-auto lg:min-h-[600px] flex-1">
                                <Editor
                                  height="100%"
                                  language="latex"
                                  theme="vs-dark"
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column: Previewer */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-medium">PDF Preview</Label>
                    </div>
                    <div className="rounded-lg border bg-muted w-full aspect-[8.5/11] flex flex-col items-center justify-center">
                      {isCompiling ? (
                        <div className="flex flex-col gap-4 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                          <p className="text-muted-foreground">Compiling...</p>
                        </div>
                      ) : pdfPreviewUrl ? (
                        <iframe
                          src={pdfPreviewUrl}
                          className="w-full h-full rounded-md"
                          title="PDF Preview"
                        />
                      ) : (
                        <div className="flex flex-col gap-4 text-center p-4">
                          <FileWarning className="h-10 w-10 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">Click "Compile & Preview" to see your PDF.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
