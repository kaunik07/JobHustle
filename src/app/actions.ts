
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { applications, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Application, User } from '@/lib/types';
import { fetchJobDescription } from '@/ai/flows/fetch-job-description';
import { uploadResume, deleteResumeByUrl } from '@/services/google-drive';

export async function addApplication(data: Omit<Application, 'id' | 'user' | 'jobDescription' | 'resumeUrl' | 'appliedOn' | 'dueDate'>) {
  let jobDescription = '';
  try {
    const result = await fetchJobDescription({ jobUrl: data.jobUrl });
    jobDescription = result.jobDescription;
  } catch (error) {
    console.error("Failed to fetch job description:", error);
  }
  
  const usersToApplyFor = data.userId === 'all' 
    ? await db.select().from(users) 
    : await db.select().from(users).where(eq(users.id, data.userId));
  
  for (const user of usersToApplyFor) {
    await db.insert(applications).values({
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      jobUrl: data.jobUrl,
      category: data.category,
      status: data.status,
      notes: data.notes,
      userId: user.id,
      appliedOn: data.status !== 'Yet to Apply' ? new Date() : null,
      jobDescription: jobDescription,
    });
  }
  revalidatePath('/');
}

export async function updateApplication(appId: string, data: Partial<Application>) {
  const payload: Partial<typeof applications.$inferInsert> = { ...data };
  if (data.user) {
    delete payload.user;
  }
  
  await db.update(applications).set(payload).where(eq(applications.id, appId));
  revalidatePath('/');
}

export async function attachResume(
  applicationId: string,
  fileData: { name: string; type: string; content: string }, // content is base64
  user: User,
  companyName: string
) {
  // First, check if a resume already exists and delete it from Drive before uploading a new one.
  const [app] = await db.select({ resumeUrl: applications.resumeUrl }).from(applications).where(eq(applications.id, applicationId));
  if (app && app.resumeUrl) {
    await deleteResumeByUrl(app.resumeUrl);
  }

  const driveLink = await uploadResume(fileData, user, companyName);
  await db.update(applications).set({ resumeUrl: driveLink }).where(eq(applications.id, applicationId));
  revalidatePath('/');
  return driveLink;
}

export async function removeResume(applicationId: string) {
  const [app] = await db.select({ resumeUrl: applications.resumeUrl }).from(applications).where(eq(applications.id, applicationId));
  
  if (app && app.resumeUrl) {
    await deleteResumeByUrl(app.resumeUrl);
  }
  
  await db.update(applications).set({ resumeUrl: null }).where(eq(applications.id, applicationId));
  revalidatePath('/');
}


export async function deleteApplication(appId: string) {
  await removeResume(appId); // Also remove resume from drive if it exists
  await db.delete(applications).where(eq(applications.id, appId));
  revalidatePath('/');
}


export async function addUser(data: Omit<User, 'id' | 'avatarUrl'>) {
  await db.insert(users).values({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    avatarUrl: null,
  });
  revalidatePath('/');
}

export async function deleteUser(userId: string) {
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/');
}
