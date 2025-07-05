
import {
  pgTable,
  text,
  varchar,
  timestamp,
  pgEnum,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

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

export const resumes = pgTable('resumes', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  resumeText: text('resume_text').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    jobTitle: varchar('job_title', { length: 255 }).notNull(),
    location: varchar('location', { length: 255 }).notNull(),
    jobUrl: text('job_url').notNull(),
    jobDescription: text('job_description'),
    keywords: text('keywords').array(),
    suggestions: text('suggestions'),
    type: applicationTypeEnum('type').notNull(),
    category: categoriesEnum('category').notNull(),
    workArrangement: workArrangementEnum('work_arrangement'),
    status: statusesEnum('status').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    resumeId: text('resume_id').references(() => resumes.id, { onDelete: 'set null' }),
    notes: text('notes'),
    appliedOn: timestamp('applied_on'),
    oaDueDate: timestamp('oa_due_date'),
    oaDueDateTimezone: varchar('oa_due_date_timezone', { length: 255 }),
    oaCompletedOn: timestamp('oa_completed_on'),
    oaSkipped: boolean('oa_skipped').default(false).notNull(),
    isUsCitizenOnly: boolean('is_us_citizen_only').default(false).notNull(),
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

export const applicationResumeScores = pgTable('application_resume_scores', {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
    resumeId: text('resume_id').notNull().references(() => resumes.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    summary: text('summary').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  resumes: many(resumes),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  scores: many(applicationResumeScores),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  attachedResume: one(resumes, { fields: [applications.resumeId], references: [resumes.id] }),
  resumeScores: many(applicationResumeScores),
}));

export const applicationResumeScoresRelations = relations(applicationResumeScores, ({ one }) => ({
  application: one(applications, { fields: [applicationResumeScores.applicationId], references: [applications.id] }),
  resume: one(resumes, { fields: [applicationResumeScores.resumeId], references: [resumes.id] }),
}));
