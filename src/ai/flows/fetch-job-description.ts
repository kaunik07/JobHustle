// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Job description fetching AI agent.
 *
 * - fetchJobDescription - A function that handles the job description fetching process.
 * - FetchJobDescriptionInput - The input type for the fetchJobDescription function.
 * - FetchJobDescriptionOutput - The return type for the fetchJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FetchJobDescriptionInputSchema = z.object({
  jobUrl: z
    .string()
    .url()
    .describe('The URL of the job description page.'),
});
export type FetchJobDescriptionInput = z.infer<typeof FetchJobDescriptionInputSchema>;

const FetchJobDescriptionOutputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description fetched from the provided URL.'),
});
export type FetchJobDescriptionOutput = z.infer<typeof FetchJobDescriptionOutputSchema>;

export async function fetchJobDescription(input: FetchJobDescriptionInput): Promise<FetchJobDescriptionOutput> {
  return fetchJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fetchJobDescriptionPrompt',
  input: {schema: FetchJobDescriptionInputSchema},
  output: {schema: FetchJobDescriptionOutputSchema},
  prompt: `You are an AI assistant that extracts job descriptions from URLs.

  Please extract the job description from the following URL:
  {{jobUrl}}
  Ensure that the description is complete and accurate.
  If you cannot fetch the job description, return an empty string.`,
});

const fetchJobDescriptionFlow = ai.defineFlow(
  {
    name: 'fetchJobDescriptionFlow',
    inputSchema: FetchJobDescriptionInputSchema,
    outputSchema: FetchJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
