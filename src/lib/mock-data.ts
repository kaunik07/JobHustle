import type { Application, User, ApplicationCategory, ApplicationStatus } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alex Doe', avatarUrl: 'https://placehold.co/40x40.png' },
  { id: 'user-2', name: 'Jane Smith', avatarUrl: 'https://placehold.co/40x40.png' },
];

export const applications: Omit<Application, 'user'>[] = [
  {
    id: 'app-1',
    companyName: 'Innovate Inc.',
    jobTitle: 'Senior Frontend Engineer',
    jobUrl: 'https://example.com/job/1',
    category: 'SWE',
    status: 'Applied',
    userId: 'user-1',
  },
  {
    id: 'app-2',
    companyName: 'DataDriven Co.',
    jobTitle: 'Data Scientist',
    jobUrl: 'https://example.com/job/2',
    category: 'Data Scientist',
    status: 'Interview',
    userId: 'user-1',
  },
  {
    id: 'app-3',
    companyName: 'SecureCloud Ltd.',
    jobTitle: 'DevOps Engineer',
    jobUrl: 'https://example.com/job/3',
    category: 'SRE/Devops',
    status: 'OA',
    userId: 'user-2',
  },
  {
    id: 'app-4',
    companyName: 'QuantumLeap',
    jobTitle: 'Quantitative Analyst',
    jobUrl: 'https://example.com/job/4',
    category: 'Quant',
    status: 'Offer Letter',
    userId: 'user-1',
  },
  {
    id: 'app-5',
    companyName: 'SysCore',
    jobTitle: 'Systems Engineer',
    jobUrl: 'https://example.com/job/5',
    category: 'Systems',
    status: 'Cleared Interview',
    userId: 'user-2',
  },
    {
    id: 'app-6',
    companyName: 'Innovate Inc.',
    jobTitle: 'Junior SWE',
    jobUrl: 'https://example.com/job/6',
    category: 'SWE',
    status: 'Interview',
    userId: 'user-2',
  },
  {
    id: 'app-7',
    companyName: 'NextGen AI',
    jobTitle: 'Machine Learning Engineer',
    jobUrl: 'https://example.com/job/7',
    category: 'Data Scientist',
    status: 'Applied',
    userId: 'user-2',
  },
];
