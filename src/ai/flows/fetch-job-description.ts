
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
import { applicationTypes, categories, workArrangements } from '@/lib/types';


const FetchJobDescriptionInputSchema = z.object({
  jobUrl: z
    .string()
    .url()
    .describe('The URL of the job description page.'),
});
export type FetchJobDescriptionInput = z.infer<typeof FetchJobDescriptionInputSchema>;

const FetchJobDescriptionOutputSchema = z.object({
    companyName: z.string().optional().describe('The name of the company.'),
    jobTitle: z.string().optional().describe('The full, original title of the job position.'),
    summarizedJobTitle: z.string().optional().describe('A summarized version of the job title, capturing the core role and primary technology or focus. For example, "Early in Career Windows Software Engineer (C#, C++)" would be summarized as "Software Engineer - Windows".'),
    location: z.string().optional().describe('The primary location of the job. e.g., "San Francisco, CA" or "Remote".'),
    jobDescription: z.string().describe('The full job description text extracted from the page. If no description is found, return an empty string.'),
    type: z.enum(applicationTypes).optional().describe(`The type of employment. Must be one of: ${applicationTypes.join(', ')}`),
    category: z.enum(categories).optional().describe(`The most relevant job category. Must be one of: ${categories.join(', ')}`),
    workArrangement: z.enum(workArrangements).optional().describe(`The work arrangement. Must be one of: ${workArrangements.join(', ')}`),
});
export type FetchJobDescriptionOutput = z.infer<typeof FetchJobDescriptionOutputSchema>;

export async function fetchJobDescription(input: FetchJobDescriptionInput): Promise<FetchJobDescriptionOutput> {
  return fetchJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fetchJobDescriptionPrompt',
  input: {schema: FetchJobDescriptionInputSchema},
  output: {schema: FetchJobDescriptionOutputSchema},
  prompt: `You are an expert AI assistant that extracts structured job posting data from a webpage URL. The URL provided will point to a specific job listing. Your task is to extract information ONLY for that specific job, ignoring any other job listings that might be on the same page (e.g., in a sidebar).

  Please visit the following URL and extract the requested information.
  URL: {{jobUrl}}

  Analyze the main content of the page to identify the following details for the primary job posting:
  - Company Name
  - Job Title: Extract the full, original job title from the page.
  - Summarized Job Title: Create a concise, summarized version of the job title that captures the core role and primary technology or focus. For example, if the full title is "Early in Career Windows Software Engineer, (C#, C++)", the summarized title should be "Software Engineer - Windows".
  - Location (e.g., "City, ST", "Remote")
  - Job Description: This is the most critical field. You MUST extract the **entire, exact, and un-summarized** job description text from the webpage for the specific job at the URL. Your role for this field is to copy and paste the raw text. Do not clean, alter, rephrase, or shorten it in any way. Preserve all original line breaks and formatting as best as possible. **If you cannot find a job description, you MUST return an empty string for this field.**
  - Employment Type
  - Job Category
  - Work Arrangement

  For all fields other than 'jobDescription', you may omit them if the information is not present. However, you must always provide a value for the 'jobDescription' field. Prioritize accuracy.`,
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
