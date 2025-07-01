
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
