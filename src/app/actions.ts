
'use server';

import { revalidatePath } from 'next/cache';
import { fetchJobDescription } from '@/ai/flows/fetch-job-description';

// The functionality of addApplication and addUser has been moved to the client-side
// state management in page.tsx for this prototype version.
// In a real application, you would use these server actions to interact with a database.

export async function addApplication(formData: FormData) {
  console.log('addApplication server action called. Data:', Object.fromEntries(formData.entries()));
  // This is where you would typically save to a database.
  // Revalidating path to refetch data after mutation.
  revalidatePath('/');
}

export async function addUser(formData: FormData) {
  console.log('addUser server action called. Data:', Object.fromEntries(formData.entries()));
  // This is where you would typically save to a database.
  // Revalidating path to refetch data after mutation.
  revalidatePath('/');
}
