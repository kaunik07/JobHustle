import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addApplication } from '@/app/actions';
import { applicationTypes, categories, statuses, workArrangements } from '@/lib/types';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const apiAddApplicationSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name is required' }),
  jobTitle: z.string().min(2, { message: 'Job title is required' }),
  locations: z.array(z.string()).min(1, { message: 'At least one location is required' }),
  jobUrl: z.string().url({ message: 'Please enter a valid URL' }),
  jobDescription: z.string().optional(),
  type: z.enum(applicationTypes),
  category: z.enum(categories),
  workArrangement: z.enum(workArrangements).optional(),
  status: z.enum(statuses),
  userId: z.string().min(1, { message: 'User ID is required' }),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = apiAddApplicationSchema.parse(json);

    // Validate that the user exists if it's not 'all'
    if (data.userId !== 'all') {
      const userExists = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
      });
      if (!userExists) {
        return NextResponse.json({ message: `User with ID '${data.userId}' not found.` }, { status: 400 });
      }
    }

    const newApplications = await addApplication(data);

    return NextResponse.json(newApplications, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request body', errors: error.errors }, { status: 400 });
    }
    // Log the error for debugging
    console.error('[API POST /api/applications] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ message: 'An error occurred while creating the application.', error: errorMessage }, { status: 500 });
  }
}
