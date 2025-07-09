
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
import { Loader2, Save, Download, FileWarning, ArrowLeft, Eye, Bold } from 'lucide-react';
import { saveLatexResume, compileLatex } from '@/app/actions';
import type { Resume, User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { StreamLanguage } from '@codemirror/language';
import { EditorView, keymap } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [fontSize, setFontSize] = React.useState(12);
  const { toast } = useToast();
  const router = useRouter();
  const editorViewRef = React.useRef<EditorView | null>(null);
  
  const isEditMode = !!resume;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: resume?.name || 'Untitled Resume',
      latexContent: resume?.latexContent || `\\documentclass{article}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\author{${user.firstName} ${user.lastName}}
\\title{Resume for ...}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Contact}
Email: ${user.defaultEmail}

\\section{Education}

\\section{Experience}

\\section{Projects}

\\section{Skills}

\\end{document}
`,
    },
  });

  const toggleBold = React.useCallback((): boolean => {
    const view = editorViewRef.current;
    if (!view) return false;

    view.dispatch(view.state.changeByRange(range => {
      const selection = view.state.doc.sliceString(range.from, range.to);

      // UN-BOLDING LOGIC
      // Case 1: The user selected the text *inside* `\textbf{...}`.
      if (!range.empty) {
          const extendedFrom = Math.max(0, range.from - 8);
          const extendedTo = range.to + 1;
          const surroundingText = view.state.doc.sliceString(extendedFrom, extendedTo);

          if (surroundingText === `\\textbf{${selection}}`) {
              return {
                  changes: { from: extendedFrom, to: extendedTo, insert: selection },
                  range: EditorSelection.range(extendedFrom, extendedFrom + selection.length)
              };
          }
      }

      // Case 2: The user selected the *entire* `\textbf{...}` command.
      if (selection.startsWith('\\textbf{') && selection.endsWith('}')) {
        const unwrappedText = selection.substring(8, selection.length - 1);
        return {
          changes: { from: range.from, to: range.to, insert: unwrappedText },
          range: EditorSelection.range(range.from, range.from + unwrappedText.length)
        };
      }

      // BOLDING LOGIC: If not un-bolding, then we bold the text.
      const newText = `\\textbf{${selection}}`;

      if (range.empty) {
        // If no text is selected, insert wrapper and place cursor inside.
        return {
          changes: { from: range.from, insert: newText },
          range: EditorSelection.cursor(range.from + 8),
        };
      }
      
      // If text is selected, wrap it and select the inner text.
      return {
        changes: { from: range.from, to: range.to, insert: newText },
        range: EditorSelection.range(range.from + 8, range.from + 8 + selection.length),
      };
    }));

    view.focus();
    return true; // Indicates the command was handled
  }, []);

  const handleBoldButtonClick = () => {
    toggleBold();
  };
  
  const customKeymap = React.useMemo(() => [
    {
      key: 'Mod-b', // 'Mod' maps to Cmd on macOS and Ctrl on other systems
      run: (view) => {
        toggleBold();
        return true;
      },
    },
  ], [toggleBold]);


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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full bg-background">
        <div className="p-4 border-b flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
              </Button>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        className="text-xl font-bold border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" variant="outline" onClick={handleDownloadTex}>
              <Download className="mr-2 h-4 w-4" /> Download .tex
            </Button>
            <Button type="button" variant="secondary" onClick={handleCompile} disabled={isCompiling}>
              {isCompiling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Compile & Preview
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Resume
            </Button>
          </div>
        </div>

        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 w-full"
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex h-full flex-col p-4 pt-2 space-y-4">
              <FormField
                control={form.control}
                name="latexContent"
                render={({ field }) => (
                  <FormItem className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <FormLabel>LaTeX (.tex) Code</FormLabel>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={handleBoldButtonClick} title="Bold (Cmd/Ctrl + B)">
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Label htmlFor="font-size-select" className="text-xs text-muted-foreground">Font Size</Label>
                            <Select value={String(fontSize)} onValueChange={(value) => setFontSize(Number(value))}>
                                <SelectTrigger id="font-size-select" className="w-[80px] h-8 text-xs">
                                    <SelectValue placeholder="Size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="12">12px</SelectItem>
                                    <SelectItem value="14">14px</SelectItem>
                                    <SelectItem value="16">16px</SelectItem>
                                    <SelectItem value="18">18px</SelectItem>
                                    <SelectItem value="20">20px</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <FormControl>
                      <div className="rounded-md border flex-1 overflow-hidden relative">
                        <CodeMirror
                          value={field.value}
                          height="100%"
                          theme={vscodeDark}
                          extensions={[
                            StreamLanguage.define(stex),
                            keymap.of(customKeymap),
                          ]}
                          onChange={field.onChange}
                          className="absolute inset-0"
                          style={{ fontSize: `${fontSize}px` }}
                          onCreateEditor={(view) => {
                            editorViewRef.current = view;
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="flex h-full flex-col p-4 pt-2 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">PDF Preview</Label>
                {pdfPreviewUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                )}
              </div>
              <div className="rounded-lg border bg-muted w-full flex-1 flex flex-col items-center justify-center">
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </form>
    </Form>
  );
}
