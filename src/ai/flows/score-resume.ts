
'use server';
/**
 * @fileOverview Resume scoring AI agent.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ScoreResumeInputSchema = z.object({
  resumeText: z.string().describe('The full text of the resume.'),
  jobDescription: z.string().describe('The full text of the job description.'),
});
export type ScoreResumeInput = z.infer<typeof ScoreResumeInputSchema>;

const ScoreResumeOutputSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe('A score from 0-100 representing how well the resume matches the job description, based on skills, experience, and keywords.'),
  summary: z
    .string()
    .describe('A brief, one-sentence summary explaining the score and highlighting the key reason for the match quality.'),
});
export type ScoreResumeOutput = z.infer<typeof ScoreResumeOutputSchema>;

export async function scoreResume(input: ScoreResumeInput): Promise<ScoreResumeOutput> {
  return scoreResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreResumePrompt',
  input: {schema: ScoreResumeInputSchema},
  output: {schema: ScoreResumeOutputSchema},
  model: 'googleai/gemini-1.5-pro-latest',
  prompt: `You are an expert career coach and hiring manager. Your task is to analyze a resume against a job description and provide a match score.

Analyze the provided resume text and job description.
- Evaluate the alignment of skills, experience, and qualifications.
- Pay close attention to keywords and required technologies.
- Provide a concise, one-sentence summary explaining the reasoning behind your score.

Resume Text:
{{{resumeText}}}

Job Description:
{{{jobDescription}}}
`,
});

const scoreResumeFlow = ai.defineFlow(
  {
    name: 'scoreResumeFlow',
    inputSchema: ScoreResumeInputSchema,
    outputSchema: ScoreResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
