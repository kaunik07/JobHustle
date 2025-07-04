
'use server';

/**
 * @fileOverview Job description fetching AI agent.
 *
 * - fetchJobDescription - A function that handles the job description fetching process.
 * - FetchJobDescriptionInput - The input type for the fetchJobDescription function.
 * - FetchJobDescriptionOutput - The return type for the fetchJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { applicationTypes, categories, workArrangements } from '@/lib/types';


const FetchJobDescriptionInputSchema = z.object({
  jobUrl: z
    .string()
    .url()
    .describe('The URL of the job description page.'),
});
export type FetchJobDescriptionInput = z.infer<typeof FetchJobDescriptionInputSchema>;

const FetchJobDescriptionOutputSchema = z.object({
    companyName: z.string().describe('The name of the company.'),
    jobTitle: z.string().describe('The title of the job position.'),
    location: z.string().describe('The primary location of the job. e.g., "San Francisco, CA" or "Remote".'),
    jobDescription: z.string().describe('The full job description text extracted from the page.'),
    type: z.enum(applicationTypes).describe(`The type of employment. Must be one of: ${applicationTypes.join(', ')}`),
    category: z.enum(categories).describe(`The most relevant job category. Must be one of: ${categories.join(', ')}`),
    workArrangement: z.enum(workArrangements).describe(`The work arrangement. Must be one of: ${workArrangements.join(', ')}`),
});
export type FetchJobDescriptionOutput = z.infer<typeof FetchJobDescriptionOutputSchema>;

export async function fetchJobDescription(input: FetchJobDescriptionInput): Promise<FetchJobDescriptionOutput> {
  return fetchJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fetchJobDescriptionPrompt',
  input: {schema: FetchJobDescriptionInputSchema},
  output: {schema: FetchJobDescriptionOutputSchema},
  prompt: `You are an expert AI assistant that extracts structured job posting data from a webpage URL.

  Please visit the following URL and extract the requested information.
  URL: {{jobUrl}}

  Analyze the content of the page to identify the following details:
  - Company Name
  - Job Title
  - Location (e.g., "City, ST", "Remote")
  - The full Job Description text
  - Employment Type
  - Job Category
  - Work Arrangement

  If you cannot find a specific piece of information, you may leave the field blank. Prioritize accuracy.`,
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
