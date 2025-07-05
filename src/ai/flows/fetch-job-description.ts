
'use server';

/**
 * @fileOverview Job description fetching AI agent.
 *
 * - fetchJobDescription - A function that handles the job description fetching process.
 * - FetchJobDescriptionInput - The input type for the fetchJobDescription function.
 * - FetchJobDescriptionOutput - The return type for the fetchJobdescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const FetchJobDescriptionInputSchema = z.object({
  jobUrl: z
    .string()
    .url()
    .describe('The URL of the job description page.'),
});
export type FetchJobDescriptionInput = z.infer<typeof FetchJobDescriptionInputSchema>;

const FetchJobDescriptionOutputSchema = z.object({
    jobDescription: z.string().describe('The full, un-summarized job description text extracted from the page. If no description is found, return an empty string.'),
    isUsCitizenOnly: z.boolean().optional().describe('Whether the job is restricted to US citizens only. This is often indicated by phrases like "US Citizenship required", "must be a US Citizen", or mentions of security clearance requirements.'),
});
export type FetchJobDescriptionOutput = z.infer<typeof FetchJobDescriptionOutputSchema>;

export async function fetchJobDescription(input: FetchJobDescriptionInput): Promise<FetchJobDescriptionOutput> {
  return fetchJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fetchJobDescriptionPrompt',
  input: {schema: FetchJobDescriptionInputSchema},
  output: {schema: FetchJobDescriptionOutputSchema},
  prompt: `You are an expert AI assistant that extracts specific data from a job posting URL.

  Please visit the following URL and extract only the requested information.
  URL: {{jobUrl}}

  You must extract the following details:
  - Job Description: This is the most critical field. You MUST extract the **entire, exact, and un-summarized** job description text from the webpage for the specific job at the URL. Your role for this field is to copy and paste the raw text. Do not clean, alter, rephrase, or shorten it in any way. Preserve all original line breaks and formatting as best as possible. **If you cannot find a job description, you MUST return an empty string for this field.**
  - US Citizen Only: Check the job description for any requirements related to US citizenship (e.g., "US Citizenship required", "must be a US citizen", "requires security clearance"). Set the isUsCitizenOnly flag to true if such a requirement is found.

  Do NOT extract any other information like company name, job title, or location.`,
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
