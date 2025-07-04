
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { applications, users, resumes, applicationResumeScores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Application, User } from '@/lib/types';
import { extractResumeText } from '@/ai/flows/extract-resume-text';
import { scoreResume } from '@/ai/flows/score-resume';
import { fetchJobDescription } from '@/ai/flows/fetch-job-description';

// This function will be called to score resumes against a job description.
async function scoreResumesForApplication(applicationId: string, userId: string, jobDescription: string) {
  try {
    const userResumes = await db.select().from(resumes).where(eq(resumes.userId, userId));
    if (userResumes.length === 0 || !jobDescription) {
      return;
    }

    const scorePromises = userResumes.map(resume => 
      scoreResume({ resumeText: resume.resumeText, jobDescription }).then(score => ({
        ...score,
        resumeId: resume.id,
      }))
    );

    const scores = await Promise.all(scorePromises);
    
    const scoresToInsert = scores.map(s => ({
      applicationId,
      resumeId: s.resumeId,
      score: s.score,
      summary: s.summary,
    }));

    if (scoresToInsert.length > 0) {
      await db.insert(applicationResumeScores).values(scoresToInsert);
    }
  } catch (error) {
    console.error("Error scoring resumes for application:", error);
    // We don't want to block the main application creation if scoring fails.
  }
}

export async function addApplication(data: Omit<Application, 'id' | 'user' | 'appliedOn' | 'oaDueDate' | 'createdAt' | 'location'> & { locations: string[] }) {
  const usersToApplyFor = data.userId === 'all' 
    ? await db.select().from(users) 
    : await db.select().from(users).where(eq(users.id, data.userId));
  
  for (const location of data.locations) {
    for (const user of usersToApplyFor) {
      const [newApplication] = await db.insert(applications).values({
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
      }).returning({ id: applications.id });

      // After creating the application, trigger scoring if a job description exists.
      if (data.jobDescription) {
        // This can take a moment, but it runs on the server.
        await scoreResumesForApplication(newApplication.id, user.id, data.jobDescription);
      }
    }
  }
  revalidatePath('/');
}

export async function bulkAddApplications(applicationsData: Array<Omit<Application, 'id' | 'user' | 'appliedOn' | 'oaDueDate' | 'createdAt' | 'userId' | 'status'>>) {
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
          status: 'Yet to Apply',
          notes: data.notes,
          userId: user.id,
          appliedOn: null,
          jobDescription: data.jobDescription,
        });
    }
  }

  if (applicationsToInsert.length > 0) {
    await db.insert(applications).values(applicationsToInsert);
  }

  revalidatePath('/');
}

export async function bulkAddApplicationsFromUrls(urls: string[]) {
    const allUsers = await db.select().from(users);

    if (allUsers.length === 0) {
        throw new Error("No users exist in the system. Please add a user before bulk importing.");
    }

    const fetchPromises = urls.map(jobUrl => fetchJobDescription({ jobUrl }));
    const results = await Promise.allSettled(fetchPromises);

    const applicationsToInsert: (typeof applications.$inferInsert)[] = [];
    const failedUrls: string[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            const data = result.value;
            for (const user of allUsers) {
                applicationsToInsert.push({
                    companyName: data.companyName,
                    jobTitle: data.jobTitle,
                    jobUrl: urls[index],
                    location: data.location,
                    type: data.type,
                    category: data.category,
                    workArrangement: data.workArrangement,
                    status: 'Yet to Apply',
                    userId: user.id,
                    jobDescription: data.jobDescription,
                    appliedOn: null,
                });
            }
        } else {
            const reason = result.status === 'rejected' ? result.reason : 'No data returned';
            console.error(`Failed to fetch job description for URL: ${urls[index]}`, reason);
            failedUrls.push(urls[index]);
        }
    });

    if (applicationsToInsert.length > 0) {
      await db.insert(applications).values(applicationsToInsert);
    }
    
    revalidatePath('/');
    
    return {
        successCount: urls.length - failedUrls.length,
        failedCount: failedUrls.length,
    };
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
  
  // Scoring is now done on creation, so we remove the logic from here.
  // We just update the fields passed in.

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

export async function addResume(name: string, resumeDataUri: string, userId: string) {
  const { resumeText } = await extractResumeText({ resumeDataUri });
  await db.insert(resumes).values({
    name,
    resumeText,
    userId,
  });
  revalidatePath('/');
}

export async function deleteResume(resumeId: string) {
  await db.delete(resumes).where(eq(resumes.id, resumeId));
  revalidatePath('/');
}
