
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { applications, users, resumes, applicationResumeScores } from '@/lib/db/schema';
import { eq, and, isNotNull, or, inArray, not } from 'drizzle-orm';
import type { Application, User, Resume } from '@/lib/types';
import { extractResumeText } from '@/ai/flows/extract-resume-text';
import { scoreResume } from '@/ai/flows/score-resume';
import { fetchJobDescription } from '@/ai/flows/fetch-job-description';
import { extractKeywords } from '@/ai/flows/extract-keywords';
import { getSession } from './auth/actions';

// This function will be called to score resumes against a job description.
async function scoreResumesForApplication(applicationId: string, userId: string, jobDescription: string, throwOnError = false) {
  try {
    // Delete existing scores for this application to ensure a fresh evaluation
    await db.delete(applicationResumeScores).where(eq(applicationResumeScores.applicationId, applicationId));

    const userResumes = await db.select().from(resumes).where(and(eq(resumes.userId, userId), or(isNotNull(resumes.resumeText), isNotNull(resumes.latexContent))));
    if (userResumes.length === 0 || !jobDescription) {
      return;
    }

    const scorePromises = userResumes.map(resume => 
      scoreResume({ 
        resumeText: resume.resumeText ?? undefined,
        latexContent: resume.latexContent ?? undefined,
        jobDescription 
      }).then(score => ({
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
    if (throwOnError) {
      throw error;
    }
    // We don't want to block the main application creation if scoring fails.
  }
}

export async function addApplication(data: Omit<Application, 'id' | 'user' | 'appliedOn' | 'oaDueDate' | 'createdAt' | 'isUsCitizenOnly' | 'sponsorshipNotOffered' | 'keywords' | 'suggestions' | 'appliedWithEmail'>): Promise<Application[]> {
  let usersToApplyFor: User[] = [];

  if (data.userId === 'all') {
    usersToApplyFor = await db.select().from(users).where(not(eq(users.username, 'admin')));
  } else if (data.userId === 'manvi-and-kaunik' || data.userId === 'kaunik-and-manvi') {
    const manviAndKaunikUsers = await db
      .select()
      .from(users)
      .where(inArray(users.username, ['manvi', 'kaunik']));
      
    if (manviAndKaunikUsers.length < 2) {
      throw new Error("Could not find both 'manvi' and 'kaunik' users.");
    }
    usersToApplyFor = manviAndKaunikUsers;
  } else {
    const foundUser = await db.select().from(users).where(eq(users.id, data.userId));
    if (!foundUser || foundUser.length === 0) {
        throw new Error(`User with ID ${data.userId} not found.`);
    }
    usersToApplyFor = foundUser;
  }

  const createdApplications: Application[] = [];

  for (const user of usersToApplyFor) {
    const [newApplicationRecord] = await db.insert(applications).values({
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      jobUrl: data.jobUrl,
      locations: data.locations.join(','),
      type: data.type,
      category: data.category,
      workArrangement: data.workArrangement,
      status: data.status,
      notes: data.notes,
      userId: user.id,
      appliedOn: data.status !== 'Yet to Apply' ? new Date() : null,
      applyByDate: data.applyByDate,
      jobDescription: data.jobDescription,
      isUsCitizenOnly: false, // Default to false, AI will update it
      sponsorshipNotOffered: false, // Default to false, AI will update it
      appliedWithEmail: user.defaultEmail,
    }).returning();

    // After creating the application, trigger analysis if a job description exists.
    if (data.jobDescription) {
      const jd = data.jobDescription;
      const scoringPromise = scoreResumesForApplication(newApplicationRecord.id, user.id, jd);
      
      const jobRequirementsPromise = fetchJobDescription({ jobDescription: jd })
        .then(result => {
          if (result) {
            return db.update(applications)
              .set({ 
                  isUsCitizenOnly: result.isUsCitizenOnly,
                  sponsorshipNotOffered: result.sponsorshipNotOffered,
              })
              .where(eq(applications.id, newApplicationRecord.id));
          }
        }).catch(err => console.error("Job requirements analysis failed:", err));

      const keywordPromise = extractKeywords({ jobDescription: jd })
        .then(result => {
          if (result) {
            return db.update(applications)
              .set({ keywords: result.keywords, suggestions: result.suggestions })
              .where(eq(applications.id, newApplicationRecord.id));
          }
        }).catch(err => console.error("Keyword extraction failed:", err));

      // Await all background tasks
      await Promise.all([scoringPromise, jobRequirementsPromise, keywordPromise]);
    }
    
    const fullApplication: Application = {
        ...newApplicationRecord,
        locations: newApplicationRecord.locations.split(',').map(l => l.trim()),
        user: user,
    };
    createdApplications.push(fullApplication);
  }
  revalidatePath('/');
  return createdApplications;
}

export async function bulkAddApplications(applicationsData: Array<Omit<Application, 'id' | 'user' | 'appliedOn' | 'oaDueDate' | 'createdAt' | 'userId' | 'status' | 'locations'> & { location: string }>): Promise<Application[]> {
  const allUsers = await db.select().from(users).where(not(eq(users.username, 'admin')));
  
  if (allUsers.length === 0) {
    throw new Error("No users exist in the system to apply for. Please add a user before bulk importing.");
  }

  const createdApplications: Application[] = [];

  for (const data of applicationsData) {
    const locationsArray = data.location.split(',').map(l => l.trim()).filter(Boolean);
    if (locationsArray.length === 0) continue; // Skip rows with no location

    for (const user of allUsers) {
        const [newApplicationRecord] = await db.insert(applications).values({
          companyName: data.companyName,
          jobTitle: data.jobTitle,
          jobUrl: data.jobUrl,
          locations: locationsArray.join(','),
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
          appliedWithEmail: user.defaultEmail,
        }).returning();

        // After creating the application, trigger analysis if a job description exists.
        if (data.jobDescription) {
            const jd = data.jobDescription;
            const scoringPromise = scoreResumesForApplication(newApplicationRecord.id, user.id, jd);
            
            const jobRequirementsPromise = fetchJobDescription({ jobDescription: jd })
            .then(result => {
                if (result) {
                return db.update(applications)
                    .set({ 
                        isUsCitizenOnly: result.isUsCitizenOnly,
                        sponsorshipNotOffered: result.sponsorshipNotOffered,
                    })
                    .where(eq(applications.id, newApplicationRecord.id));
                }
            }).catch(err => console.error("Job requirements analysis failed for bulk add:", err));

            const keywordPromise = extractKeywords({ jobDescription: jd })
              .then(result => {
                if (result) {
                  return db.update(applications)
                    .set({ keywords: result.keywords, suggestions: result.suggestions })
                    .where(eq(applications.id, newApplicationRecord.id));
                }
              }).catch(err => console.error("Keyword extraction failed for bulk add:", err));

            // Await both background tasks for this application before moving to the next
            await Promise.all([scoringPromise, jobRequirementsPromise, keywordPromise]);
        }
        
        const fullApplication: Application = {
            ...newApplicationRecord,
            locations: newApplicationRecord.locations.split(',').map(l => l.trim()),
            user: user,
        };
        createdApplications.push(fullApplication);
    }
  }

  revalidatePath('/');
  return createdApplications;
}

export async function updateApplication(appId: string, data: Partial<Application>) {
  const { locations, user, createdAt, customLatexResume, ...rest } = data;
  const payload: Partial<typeof applications.$inferInsert> = {
    ...rest,
  };

  if (locations) {
    payload.locations = locations.join(', ');
  }

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

    // scoreResumesForApplication now handles deleting old scores internally
    await scoreResumesForApplication(applicationId, application.userId, application.jobDescription, true);
    
    revalidatePath('/');
  } catch (error) {
    console.error("Error re-evaluating resume scores:", error);
    // Let the client know something went wrong
    throw new Error('Failed to re-evaluate resume scores.');
  }
}

export async function reevaluateAiAnalysis(applicationId: string) {
  try {
    const [application] = await db
      .select({ jobDescription: applications.jobDescription })
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!application || !application.jobDescription) {
      console.warn(`AI analysis skipped: Application ${applicationId} has no job description.`);
      return;
    }

    const jd = application.jobDescription;

    // Run both AI analyses concurrently
    const [keywordsResult, requirementsResult] = await Promise.all([
      extractKeywords({ jobDescription: jd }),
      fetchJobDescription({ jobDescription: jd }),
    ]);

    await db.update(applications)
      .set({ 
        keywords: keywordsResult.keywords,
        suggestions: keywordsResult.suggestions,
        isUsCitizenOnly: requirementsResult.isUsCitizenOnly,
        sponsorshipNotOffered: requirementsResult.sponsorshipNotOffered,
      })
      .where(eq(applications.id, applicationId));
    
    revalidatePath('/');
  } catch (error) {
    console.error("Error re-evaluating AI analysis:", error);
    throw new Error('Failed to re-evaluate AI analysis.');
  }
}

export async function updateUser(userId: string, data: { firstName: string, lastName: string, emailAddresses: string[], defaultEmail: string }) {
  if (!data.emailAddresses.includes(data.defaultEmail)) {
    throw new Error('Default email must be one of the emails in the list.');
  }
  if (data.emailAddresses.length === 0) {
    throw new Error('User must have at least one email.');
  }

  await db.update(users)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddresses: data.emailAddresses,
      defaultEmail: data.defaultEmail,
    })
    .where(eq(users.id, userId));
  
  revalidatePath('/');
}

export async function addUser(data: { username: string; firstName: string, lastName: string, email: string }) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.username.toLowerCase() !== 'admin') {
    throw new Error('Unauthorized');
  }

  await db.insert(users).values({
    username: data.username,
    firstName: data.firstName,
    lastName: data.lastName,
    emailAddresses: [data.email],
    defaultEmail: data.email,
    avatarUrl: null,
    // You should add a way to set a password securely.
    // For now, setting a default, but this is NOT secure.
    password: 'password', 
  });
  revalidatePath('/');
}

export async function deleteUser(userId: string) {
    const session = await getSession();
    if (!session.isLoggedIn || (session.user?.username.toLowerCase() !== 'admin' && session.user?.username.toLowerCase() !== 'kaunik')) {
        throw new Error('Unauthorized');
    }
    if (session.user.id === userId) {
      throw new Error('Cannot delete your own user account.');
    }
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

  // Re-score all applications for this user
  const userApplications = await db.select().from(applications).where(eq(applications.userId, userId));
  for (const app of userApplications) {
    if (app.jobDescription) {
      await scoreResumesForApplication(app.id, userId, app.jobDescription);
    }
  }

  revalidatePath('/');
}

export async function saveLatexResume(data: { id?: string; name: string; latexContent: string; userId: string; applicationId?: string }) {
  let resumeId: string;

  if (data.id) {
    // Update existing
    const [updatedResume] = await db.update(resumes).set({
      name: data.name,
      latexContent: data.latexContent,
    }).where(eq(resumes.id, data.id)).returning({id: resumes.id});
    resumeId = updatedResume.id;
  } else {
    // Create new
    const [newResume] = await db.insert(resumes).values({
      name: data.name,
      latexContent: data.latexContent,
      userId: data.userId,
    }).returning({id: resumes.id});
    resumeId = newResume.id;
  }
  
  // If an applicationId is passed, attach this resume to it.
  if (data.applicationId) {
    await db.update(applications)
      .set({ latexResumeId: resumeId })
      .where(eq(applications.id, data.applicationId));
  }

  // Re-score all applications for this user since this resume might be a better fit
  const userApplications = await db
    .select({ id: applications.id, jobDescription: applications.jobDescription })
    .from(applications)
    .where(and(eq(applications.userId, data.userId), isNotNull(applications.jobDescription)));

  for (const app of userApplications) {
    if (app.jobDescription) {
      await scoreResumesForApplication(app.id, data.userId, app.jobDescription);
    }
  }

  revalidatePath('/');
}

export async function createLatexResumeForApplication(applicationId: string, userId: string) {
    const [app] = await db.select({ companyName: applications.companyName }).from(applications).where(eq(applications.id, applicationId));
    if (!app) throw new Error('Application not found');

    const [newResume] = await db.insert(resumes).values({
        name: `Resume for ${app.companyName}`,
        latexContent: `\\documentclass{article}\n\\title{Resume for ${app.companyName}}\n\\author{...}\n\\date{\\today}\n\\begin{document}\n\n\\maketitle\n\n\\section{Introduction}\nYour content here.\n\n\\end{document}}`,
        userId: userId,
    }).returning({ id: resumes.id });

    await db.update(applications)
      .set({ latexResumeId: newResume.id })
      .where(eq(applications.id, applicationId));
    
    revalidatePath('/');
    return newResume.id;
}

export async function copyLatexResumeForApplication(originalResumeId: string, applicationId: string, userId: string) {
    const [originalResume] = await db.select().from(resumes).where(eq(resumes.id, originalResumeId));
    const [app] = await db.select({ companyName: applications.companyName }).from(applications).where(eq(applications.id, applicationId));

    if (!originalResume || !app) throw new Error('Original resume or application not found');

    const [newResume] = await db.insert(resumes).values({
        name: `${originalResume.name} - For ${app.companyName}`,
        latexContent: originalResume.latexContent,
        userId: userId,
    }).returning({ id: resumes.id });

    await db.update(applications)
      .set({ latexResumeId: newResume.id })
      .where(eq(applications.id, applicationId));
    
    revalidatePath('/');
    return newResume.id;
}

export async function detachLatexResume(applicationId: string) {
    await db.update(applications)
        .set({ latexResumeId: null })
        .where(eq(applications.id, applicationId));
    revalidatePath('/');
}


export async function deleteResume(resumeId: string) {
  await db.delete(resumes).where(eq(resumes.id, resumeId));
  revalidatePath('/');
}

export async function compileLatex(latexContent: string): Promise<{ pdfBase64: string } | { error: string }> {
  const endpoint = "https://latex-compiler-production.up.railway.app/compile";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: latexContent }),
      signal: controller.signal, // Pass the abort signal to fetch
    });
    
    clearTimeout(timeoutId); // Clear the timeout if the request completes in time

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`LaTeX compilation failed with status ${response.status}:`, errorBody);
      return { error: `Compilation failed: ${errorBody || response.statusText}` };
    }

    const pdfBuffer = await response.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    if (!pdfBase64) {
      return { error: 'Invalid response from compiler: received empty PDF.' };
    }

    return { pdfBase64 };
  } catch (error) {
    clearTimeout(timeoutId); // Also clear timeout on error
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('LaTeX compilation timed out after 90 seconds.');
      return { error: 'Compilation timed out after 90 seconds. The request was aborted.' };
    }
    console.error('Error calling LaTeX compiler endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred.';
    return { error: `Failed to connect to the compiler service: ${errorMessage}` };
  }
}

    