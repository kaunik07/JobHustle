
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { applications, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Application, User } from '@/lib/types';

export async function addApplication(data: Omit<Application, 'id' | 'user' | 'resumeUrl' | 'appliedOn' | 'oaDueDate' | 'createdAt' | 'location'> & { locations: string[] }) {
  const usersToApplyFor = data.userId === 'all' 
    ? await db.select().from(users) 
    : await db.select().from(users).where(eq(users.id, data.userId));
  
  for (const location of data.locations) {
    for (const user of usersToApplyFor) {
      await db.insert(applications).values({
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobUrl: data.jobUrl,
        location: location,
        type: data.type,
        category: data.category,
        workArrangement: data.workArrangement,
        status: data.status,
        notes: data.notes,
        userId: user.id,
        appliedOn: data.status !== 'Yet to Apply' ? new Date() : null,
        jobDescription: data.jobDescription,
      });
    }
  }
  revalidatePath('/');
}

export async function bulkAddApplications(applicationsData: Array<Omit<Application, 'id' | 'user' | 'resumeUrl' | 'appliedOn' | 'oaDueDate' | 'createdAt' | 'userId'>>) {
  const allUsers = await db.select().from(users);
  
  if (allUsers.length === 0) {
    throw new Error("No users exist in the system. Please add a user before bulk importing.");
  }

  const applicationsToInsert: (typeof applications.$inferInsert)[] = [];

  for (const data of applicationsData) {
    for (const user of allUsers) {
        applicationsToInsert.push({
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          jobUrl: data.jobUrl,
          location: data.location,
          type: data.type,
          category: data.category,
          workArrangement: data.workArrangement,
          status: data.status,
          notes: data.notes,
          userId: user.id,
          appliedOn: data.status !== 'Yet to Apply' ? new Date() : null,
          jobDescription: data.jobDescription,
        });
    }
  }

  if (applicationsToInsert.length > 0) {
    await db.insert(applications).values(applicationsToInsert);
  }

  revalidatePath('/');
}

export async function updateApplication(appId: string, data: Partial<Application>) {
  const payload: Partial<typeof applications.$inferInsert> = { ...data };
  if (data.user) {
    delete payload.user;
  }
  // Prevent createdAt from being updated
  if (payload.createdAt) {
    delete payload.createdAt;
  }
  
  await db.update(applications).set(payload).where(eq(applications.id, appId));
  revalidatePath('/');
}

export async function deleteApplication(appId: string) {
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
