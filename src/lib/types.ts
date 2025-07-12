
export type ApplicationStatus = 'Yet to Apply' | 'Applied' | 'OA' | 'Interview' | 'Offer' | 'Rejected' | 'Not Applicable';

export const statuses: ApplicationStatus[] = ['Yet to Apply', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected', 'Not Applicable'];

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

export const technicalSkills: string[] = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'SQL', 'NoSQL',
    // Frontend
    'HTML', 'CSS', 'React', 'Angular', 'Vue.js', 'Next.js', 'Gatsby', 'Svelte', 'Tailwind CSS', 'Bootstrap', 'Sass/SCSS', 'Webpack', 'Vite',
    // Backend
    'Node.js', 'Express.js', 'Django', 'Flask', 'Ruby on Rails', 'ASP.NET', 'Spring Boot', 'Gin',
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase', 'DynamoDB',
    // DevOps & SRE
    'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'Git', 'GitHub Actions', 'CI/CD', 'Prometheus', 'Grafana', 'Datadog',
    // Cloud
    'AWS', 'Google Cloud (GCP)', 'Microsoft Azure',
    // Systems & Networking
    'Linux', 'Bash Scripting', 'Networking', 'TCP/IP',
    // Data Science & ML
    'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Jupyter', 'R', 'Matplotlib',
    // Quant
    'Financial Modeling', 'Quantitative Analysis', 'Machine Learning', 'Statistics', 'Time Series Analysis',
    // Other
    'GraphQL', 'REST APIs', 'gRPC', 'Agile', 'Scrum'
];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: string[];
  defaultEmail: string;
  avatarUrl: string | null;
  resumes?: Resume[];
}

export interface Resume {
  id: string;
  name: string;
  resumeText: string | null;
  latexContent: string | null;
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
  locations: string[];
  jobUrl: string;
  jobDescription?: string | null;
  keywords?: string[] | null;
  suggestions?: string | null;
  type: ApplicationType;
  category: ApplicationCategory;
  workArrangement?: ApplicationWorkArrangement | null;
  status: ApplicationStatus;
  userId: string;
  user?: User;
  resumeId?: string | null;
  latexResumeId?: string | null;
  customLatexResume?: Resume | null;
  notes?: string | null;
  appliedOn?: Date | null;
  appliedWithEmail?: string | null;
  oaDueDate?: Date | null;
  oaDueDateTimezone?: string | null;
  oaCompletedOn?: Date | null;
  oaSkipped: boolean;
  isUsCitizenOnly: boolean;
  sponsorshipNotOffered: boolean;
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
