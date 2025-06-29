export type ApplicationStatus = 'Yet to Apply' | 'Applied' | 'OA' | 'Interview' | 'Cleared' | 'Offer';

export const statuses: ApplicationStatus[] = ['Yet to Apply', 'Applied', 'OA', 'Interview', 'Cleared', 'Offer'];

export type ApplicationCategory = 'SWE' | 'SRE/Devops' | 'Quant' | 'Systems' | 'Data Scientist';

export const categories: ApplicationCategory[] = ['SWE', 'SRE/Devops', 'Quant', 'Systems', 'Data Scientist'];

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription?: string;
  resumeUrl?: string;
  category: ApplicationCategory;
  status: ApplicationStatus;
  userId: string;
  user?: User;
}
