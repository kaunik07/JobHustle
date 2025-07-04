
'use server';
/**
 * @fileOverview Resume text extraction AI agent.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractResumeTextInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A PDF resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractResumeTextInput = z.infer<typeof ExtractResumeTextInputSchema>;

const ExtractResumeTextOutputSchema = z.object({
  resumeText: z
    .string()
    .describe('The full text extracted from the provided resume PDF.'),
});
export type ExtractResumeTextOutput = z.infer<typeof ExtractResumeTextOutputSchema>;

export async function extractResumeText(input: ExtractResumeTextInput): Promise<ExtractResumeTextOutput> {
  return extractResumeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractResumeTextPrompt',
  input: {schema: ExtractResumeTextInputSchema},
  output: {schema: ExtractResumeTextOutputSchema},
  prompt: `You are an expert text extraction tool. Your task is to accurately extract all text content from the provided PDF document. Do not summarize, analyze, or alter the text in any way. Preserve the original line breaks and spacing as much as possible.

  PDF to extract from:
  {{media url=resumeDataUri}}`,
});

const extractResumeTextFlow = ai.defineFlow(
  {
    name: 'extractResumeTextFlow',
    inputSchema: ExtractResumeTextInputSchema,
    outputSchema: ExtractResumeTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
