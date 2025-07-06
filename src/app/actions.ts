
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { applications, users, resumes, applicationResumeScores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Application, User } from '@/lib/types';
import { extractResumeText } from '@/ai/flows/extract-resume-text';
import { scoreResume } from '@/ai/flows/score-resume';
import { fetchJobDescription } from '@/ai/flows/fetch-job-description';
import { extractKeywords } from '@/ai/flows/extract-keywords';

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

export async function addApplication(data: Omit<Application, 'id' | 'user' | 'appliedOn' | 'oaDueDate' | 'createdAt' | 'location' | 'isUsCitizenOnly' | 'sponsorshipNotOffered' | 'keywords' | 'suggestions'> & { locations: string[] }) {
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
        isUsCitizenOnly: false, // Default to false, AI will update it
        sponsorshipNotOffered: false, // Default to false, AI will update it
      }).returning({ id: applications.id });

      // After creating the application, trigger analysis if a job description exists.
      if (data.jobDescription) {
        const jd = data.jobDescription;
        const scoringPromise = scoreResumesForApplication(newApplication.id, user.id, jd);
        
        const jobRequirementsPromise = fetchJobDescription({ jobDescription: jd })
          .then(result => {
            if (result) {
              return db.update(applications)
                .set({ 
                    isUsCitizenOnly: result.isUsCitizenOnly,
                    sponsorshipNotOffered: result.sponsorshipNotOffered,
                })
                .where(eq(applications.id, newApplication.id));
            }
          }).catch(err => console.error("Job requirements analysis failed:", err));

        const keywordPromise = extractKeywords({ jobDescription: jd })
          .then(result => {
            if (result) {
              return db.update(applications)
                .set({ keywords: result.keywords, suggestions: result.suggestions })
                .where(eq(applications.id, newApplication.id));
            }
          }).catch(err => console.error("Keyword extraction failed:", err));

        // Await all background tasks
        await Promise.all([scoringPromise, jobRequirementsPromise, keywordPromise]);
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

  for (const data of applicationsData) {
    for (const user of allUsers) {
        const [newApplication] = await db.insert(applications).values({
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
          isUsCitizenOnly: false,
          sponsorshipNotOffered: false,
        }).returning({ id: applications.id });

        // After creating the application, trigger analysis if a job description exists.
        if (data.jobDescription) {
            const jd = data.jobDescription;
            const scoringPromise = scoreResumesForApplication(newApplication.id, user.id, jd);
            
            const jobRequirementsPromise = fetchJobDescription({ jobDescription: jd })
            .then(result => {
                if (result) {
                return db.update(applications)
                    .set({ 
                        isUsCitizenOnly: result.isUsCitizenOnly,
                        sponsorshipNotOffered: result.sponsorshipNotOffered,
                    })
                    .where(eq(applications.id, newApplication.id));
                }
            }).catch(err => console.error("Job requirements analysis failed for bulk add:", err));

            const keywordPromise = extractKeywords({ jobDescription: jd })
              .then(result => {
                if (result) {
                  return db.update(applications)
                    .set({ keywords: result.keywords, suggestions: result.suggestions })
                    .where(eq(applications.id, newApplication.id));
                }
              }).catch(err => console.error("Keyword extraction failed for bulk add:", err));

            // Await both background tasks for this application before moving to the next
            await Promise.all([scoringPromise, jobRequirementsPromise, keywordPromise]);
        }
    }
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
  
  // Scoring is now done on creation, so we remove the logic from here.
  // We just update the fields passed in.

  await db.update(applications).set(payload).where(eq(applications.id, appId));
  revalidatePath('/');
}

export async function deleteApplication(appId: string) {
  await db.delete(applications).where(eq(applications.id, appId));
  revalidatePath('/');
}

export async function reevaluateScores(applicationId: string) {
  try {
    const [application] = await db
      .select({
        jobDescription: applications.jobDescription,
        userId: applications.userId,
      })
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!application || !application.jobDescription) {
      console.warn(`Re-evaluation skipped: Application ${applicationId} has no job description.`);
      return;
    }

    // Delete existing scores to ensure a fresh evaluation
    await db.delete(applicationResumeScores).where(eq(applicationResumeScores.applicationId, applicationId));

    // Reuse the existing scoring logic
    await scoreResumesForApplication(applicationId, application.userId, application.jobDescription);
    
    revalidatePath('/'); // This will trigger a re-fetch on the client
  } catch (error) {
    console.error("Error re-evaluating resume scores:", error);
    // Let the client know something went wrong
    throw new Error('Failed to re-evaluate resume scores.');
  }
}

export async function reevaluateKeywords(applicationId: string) {
  try {
    const [application] = await db
      .select({
        jobDescription: applications.jobDescription,
      })
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!application || !application.jobDescription) {
      console.warn(`Keyword re-evaluation skipped: Application ${applicationId} has no job description.`);
      return;
    }

    const { keywords, suggestions } = await extractKeywords({ jobDescription: application.jobDescription });

    await db.update(applications)
      .set({ keywords, suggestions })
      .where(eq(applications.id, applicationId));
    
    revalidatePath('/');
  } catch (error) {
    console.error("Error re-evaluating keywords:", error);
    throw new Error('Failed to re-evaluate keywords.');
  }
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
