
'use server';

/**
 * @fileOverview Job description analysis AI agent.
 *
 * - fetchJobDescription - A function that handles the job description analysis process.
 * - FetchJobDescriptionInput - The input type for the fetchJobDescription function.
 * - FetchJobDescriptionOutput - The return type for the fetchJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Input is now the job description text itself
const FetchJobDescriptionInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The full text of the job description to be analyzed.'),
});
export type FetchJobDescriptionInput = z.infer<typeof FetchJobDescriptionInputSchema>;

// Output is just the citizenship flag
const FetchJobDescriptionOutputSchema = z.object({
    isUsCitizenOnly: z.boolean().optional().describe('Whether the job is restricted to US citizens only. This is often indicated by phrases like "US Citizenship required", "must be a US Citizen", or mentions of security clearance requirements.'),
});
export type FetchJobDescriptionOutput = z.infer<typeof FetchJobDescriptionOutputSchema>;

// The function name is kept for simplicity, but its role has changed.
export async function fetchJobDescription(input: FetchJobDescriptionInput): Promise<FetchJobDescriptionOutput> {
  return fetchJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fetchJobDescriptionPrompt',
  input: {schema: FetchJobDescriptionInputSchema},
  output: {schema: FetchJobDescriptionOutputSchema},
  prompt: `You are an expert AI assistant that analyzes raw job description text. Your task is to determine if the job has a US citizenship requirement.

  Analyze the provided job description text.
  Job Description:
  {{{jobDescription}}}

  You must determine the following:
  - isUsCitizenOnly: Check the job description for any requirements related to US citizenship (e.g., "US Citizenship required", "must be a US citizen", "requires security clearance"). Set this flag to true if such a requirement is found, otherwise set it to false.
  
  Only output the boolean flag. Do not extract any other information.`,
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
