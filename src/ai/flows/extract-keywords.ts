'use server';
/**
 * @fileOverview Job description keyword extraction AI agent.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExtractKeywordsInputSchema = z.object({
  jobDescription: z.string().describe('The full text of the job description.'),
});
export type ExtractKeywordsInput = z.infer<typeof ExtractKeywordsInputSchema>;

const ExtractKeywordsOutputSchema = z.object({
  keywords: z.array(z.string()).describe('A list of relevant keywords extracted from the job description.'),
  suggestions: z.string().describe('Suggestions on how to improve the job description\'s visibility and attractiveness.'),
});
export type ExtractKeywordsOutput = z.infer<typeof ExtractKeywordsOutputSchema>;

export async function extractKeywords(input: ExtractKeywordsInput): Promise<ExtractKeywordsOutput> {
  return extractKeywordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeywordsPrompt',
  input: {schema: ExtractKeywordsInputSchema},
  output: {schema: ExtractKeywordsOutputSchema},
  prompt: `Act as an employment tracking system designed to analyze the provided job description for keywords. Your task is to meticulously comb through the provided job description, identifying and extracting all relevant keywords that potential applicants might use when searching for job opportunities. This includes job-specific terms, skills, qualifications, software or tools mentioned, and any industry-specific language. The goal is to optimize the job posting for search engines and job search platforms, ensuring it reaches the most qualified and interested candidates. The analysis should also offer suggestions on how to improve the job description's visibility and attractiveness to the target demographic, potentially increasing the number and quality of applications received.

Job Description:
{{{jobDescription}}}
`,
});

const extractKeywordsFlow = ai.defineFlow(
  {
    name: 'extractKeywordsFlow',
    inputSchema: ExtractKeywordsInputSchema,
    outputSchema: ExtractKeywordsOutputSchema,
  },
  async input => {
     if (!input.jobDescription?.trim()) {
        return { keywords: [], suggestions: '' };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
