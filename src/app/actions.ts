
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { applications, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Application, User } from '@/lib/types';

export async function addApplication(data: Omit<Application, 'id' | 'user'>) {
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


export async function deleteApplication(appId: string) {
    await db.delete(applications).where(eq(applications.id, appId));
    revalidatePath('/');
}


export async function addUser(data: Omit<User, 'id' | 'avatarUrl'>) {
  await db.insert(users).values({
    ...data,
    avatarUrl: 'https://placehold.co/40x40.png',
  });
  revalidatePath('/');
}

export async function deleteUser(userId: string) {
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/');
}
