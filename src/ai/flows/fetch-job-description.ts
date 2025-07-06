
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

// Output is now the citizenship flag
const FetchJobDescriptionOutputSchema = z.object({
    isUsCitizenOnly: z.boolean().describe('Whether the job is restricted to US citizens only. This is often indicated by phrases like "US Citizenship required", "must be a US Citizen", or mentions of security clearance requirements.'),
    sponsorshipNotOffered: z.boolean().describe('Whether the job description explicitly states that visa sponsorship is not available. This is often indicated by phrases like "sponsorship not available", "we do not sponsor visas", or "candidates must have pre-existing work authorization."')
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
  prompt: `You are an expert AI assistant that analyzes raw job description text. Your task is to determine if the job has a US citizenship requirement and if it explicitly states that visa sponsorship is not provided.

  Analyze the provided job description text.
  Job Description:
  {{{jobDescription}}}

  You must determine the following two things:
  - isUsCitizenOnly: Check for requirements related to US citizenship (e.g., "US Citizenship required", "must be a US citizen", "requires security clearance"). Set this to true if found, otherwise false.
  - sponsorshipNotOffered: Check for statements indicating that visa sponsorship is not available (e.g., "sponsorship not available", "we do not sponsor visas", "must have work authorization"). Set this to true if found, otherwise false.
  
  Only output the boolean flags. Do not extract any other information.`,
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
