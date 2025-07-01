
export type ApplicationStatus = 'Yet to Apply' | 'Applied' | 'OA' | 'Interview' | 'Offer' | 'Rejected';

export const statuses: ApplicationStatus[] = ['Yet to Apply', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

export const kanbanStatuses: ApplicationStatus[] = ['Applied', 'OA', 'Interview', 'Offer'];

export type ApplicationCategory = 'SWE' | 'SRE/Devops' | 'Quant' | 'Systems' | 'Data Scientist';

export const categories: ApplicationCategory[] = ['SWE', 'SRE/Devops', 'Quant', 'Systems', 'Data Scientist'];

export type ApplicationType = 'Internship' | 'Full-Time';

export const applicationTypes: ApplicationType[] = ['Internship', 'Full-Time'];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export interface Application {
  id:string;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription?: string | null;
  resumeUrl?: string | null;
  type: ApplicationType;
  category: ApplicationCategory;
  status: ApplicationStatus;
  userId: string;
  user?: User;
  notes?: string | null;
  appliedOn?: Date | null;
  dueDate?: Date | null;
  createdAt: Date;
}
