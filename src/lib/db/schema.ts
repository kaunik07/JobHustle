
import {
  pgTable,
  text,
  varchar,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const categoriesEnum = pgEnum('category', ['SWE', 'SRE/Devops', 'Quant', 'Systems', 'Data Scientist']);
export const statusesEnum = pgEnum('status', ['Yet to Apply', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected']);
export const applicationTypeEnum = pgEnum('type', ['Internship', 'Full-Time']);
export const workArrangementEnum = pgEnum('work_arrangement', ['On-site', 'Remote', 'Hybrid']);

export const users = pgTable('users', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  avatarUrl: text('avatar_url'),
});

export const applications = pgTable('applications', {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    jobTitle: varchar('job_title', { length: 255 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    jobUrl: text('job_url').notNull(),
    jobDescription: text('job_description'),
    resumeUrl: text('resume_url'),
    type: applicationTypeEnum('type').notNull(),
    category: categoriesEnum('category').notNull(),
    workArrangement: workArrangementEnum('work_arrangement'),
    status: statusesEnum('status').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    notes: text('notes'),
    appliedOn: timestamp('applied_on'),
    oaDueDate: timestamp('oa_due_date'),
    oaDueDateTimezone: varchar('oa_due_date_timezone', { length: 255 }),
    oaCompletedOn: timestamp('oa_completed_on'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    interviewDate1: timestamp('interview_date_1'),
    interviewDateTimezone1: varchar('interview_date_timezone_1', { length: 255 }),
    interviewDate2: timestamp('interview_date_2'),
    interviewDateTimezone2: varchar('interview_date_timezone_2', { length: 255 }),
    interviewDate3: timestamp('interview_date_3'),
    interviewDateTimezone3: varchar('interview_date_timezone_3', { length: 255 }),
    interviewDate4: timestamp('interview_date_4'),
    interviewDateTimezone4: varchar('interview_date_timezone_4', { length: 255 }),
    interviewDate5: timestamp('interview_date_5'),
    interviewDateTimezone5: varchar('interview_date_timezone_5', { length: 255 }),
    interviewDate6: timestamp('interview_date_6'),
    interviewDateTimezone6: varchar('interview_date_timezone_6', { length: 255 }),
    interviewDate7: timestamp('interview_date_7'),
    interviewDateTimezone7: varchar('interview_date_timezone_7', { length: 255 }),
    interviewDate8: timestamp('interview_date_8'),
    interviewDateTimezone8: varchar('interview_date_timezone_8', { length: 255 }),
    interviewDate9: timestamp('interview_date_9'),
    interviewDateTimezone9: varchar('interview_date_timezone_9', { length: 255 }),
    interviewDate10: timestamp('interview_date_10'),
    interviewDateTimezone10: varchar('interview_date_timezone_10', { length: 255 }),
});
