
'use server';

import { revalidatePath } from 'next/cache';
import { fetchJobDescription } from '@/ai/flows/fetch-job-description';

export async function addApplication(formData: FormData) {
  const jobUrl = formData.get('jobUrl') as string;
  const companyName = formData.get('companyName') as string;
  const userId = formData.get('userId') as string;

  if (userId === 'all') {
    console.log(`New application for "${formData.get('jobTitle')}" at ${companyName} will be added for all users.`);
    // In a real application, you would loop through all users and create an application for each.
  } else {
    console.log('New application added for:', companyName);
  }
  
  console.log('Data:', Object.fromEntries(formData.entries()));

  // In a real application, you would save this data to a database.
  // We are not saving it here, but we will revalidate the path so that
  // if we were fetching from a DB, the new data would appear.
  
  // Asynchronously fetch job description without blocking the response.
  if (jobUrl) {
    fetchJobDescription({ jobUrl })
      .then(result => {
        console.log(`Fetched job description for ${companyName}:`, result.jobDescription.substring(0, 100) + '...');
        // Here you would update the database record with the job description.
      })
      .catch(error => {
        console.error(`Failed to fetch job description for ${companyName}:`, error);
      });
  }

  // Revalidate the page to reflect changes if data were persisted.
  revalidatePath('/');
}

export async function addUser(formData: FormData) {
  const name = formData.get('name') as string;
  console.log('New user added:', name);

  // In a real application, you would save this data to a database.
  // We are not saving it here, just revalidating the path.
  revalidatePath('/');
}
