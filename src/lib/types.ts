

export type ApplicationStatus = 'Yet to Apply' | 'Applied' | 'OA' | 'Interview' | 'Offer' | 'Rejected';

export const statuses: ApplicationStatus[] = ['Yet to Apply', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

export const kanbanStatuses: ApplicationStatus[] = ['Applied', 'OA', 'Interview', 'Offer'];

export type ApplicationCategory = 'SWE' | 'SRE/Devops' | 'Quant' | 'Systems' | 'Data Scientist';

export const categories: ApplicationCategory[] = ['SWE', 'SRE/Devops', 'Quant', 'Systems', 'Data Scientist'];

export type ApplicationType = 'Internship' | 'Full-Time';

export const applicationTypes: ApplicationType[] = ['Internship', 'Full-Time'];

export type ApplicationWorkArrangement = 'On-site' | 'Remote' | 'Hybrid';

export const workArrangements: ApplicationWorkArrangement[] = ['On-site', 'Remote', 'Hybrid'];

export const suggestedLocations: string[] = [
    'San Francisco, CA',
    'Seattle, WA',
    'New York, NY',
    'Austin, TX',
    'Boston, MA',
    'San Jose, CA',
    'Washington, DC',
    'Denver, CO',
    'Chicago, IL',
    'Atlanta, GA',
    'Dallas, TX',
    'Raleigh, NC',
    'Phoenix, AZ',
    'San Diego, CA',
    'Houston, TX',
    'Minneapolis, MN',
    'Portland, OR',
    'Salt Lake City, UT',
    'Detroit, MI',
    'Miami, FL',
    'Nashville, TN',
    'Columbus, OH',
    'Charlotte, NC',
    'Pittsburgh, PA',
    'Tampa, FL',
    'Indianapolis, IN',
    'Kansas City, MO',
    'St. Louis, MO',
    'Sacramento, CA',
    'San Antonio, TX',
    'Richmond, VA',
    'Baltimore, MD',
    'Jacksonville, FL',
    'Louisville, KY',
    'Albuquerque, NM',
    'Oklahoma City, OK',
    'Hartford, CT',
    'New Orleans, LA',
    'Irvine, CA',
    'Boulder, CO',
    'Provo, UT',
    'Madison, WI',
    'Durham, NC',
    'Greenville, SC',
    'Boise, ID',
    'Spokane, WA',
    'Huntsville, AL',
    'Providence, RI',
    'Des Moines, IA',
    'Lincoln, NE',
];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export interface Resume {
  id: string;
  name: string;
  resumeText: string;
  userId: string;
  createdAt: Date;
  applicationCount?: number;
}

export interface ResumeScore {
  id: string;
  applicationId: string;
  resumeId: string;
  score: number;
  summary: string;
  resume: Pick<Resume, 'id' | 'name' | 'createdAt'>;
}

export interface Application {
  id:string;
  companyName: string;
  jobTitle: string;
  location: string;
  jobUrl: string;
  jobDescription?: string | null;
  type: ApplicationType;
  category: ApplicationCategory;
  workArrangement?: ApplicationWorkArrangement | null;
  status: ApplicationStatus;
  userId: string;
  user?: User;
  resumeId?: string | null;
  notes?: string | null;
  appliedOn?: Date | null;
  oaDueDate?: Date | null;
  oaDueDateTimezone?: string | null;
  oaCompletedOn?: Date | null;
  oaSkipped: boolean;
  createdAt: Date;
  interviewDate1?: Date | null;
  interviewDateTimezone1?: string | null;
  interviewDate2?: Date | null;
  interviewDateTimezone2?: string | null;
  interviewDate3?: Date | null;
  interviewDateTimezone3?: string | null;
  interviewDate4?: Date | null;
  interviewDateTimezone4?: string | null;
  interviewDate5?: Date | null;
  interviewDateTimezone5?: string | null;
  interviewDate6?: Date | null;
  interviewDateTimezone6?: string | null;
  interviewDate7?: Date | null;
  interviewDateTimezone7?: string | null;
  interviewDate8?: Date | null;
  interviewDateTimezone8?: string | null;
  interviewDate9?: Date | null;
  interviewDateTimezone9?: string | null;
  interviewDate10?: Date | null;
  interviewDateTimezone10?: string | null;
  resumeScores?: ResumeScore[];
}
