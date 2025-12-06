import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "voter"] }).notNull().default("voter"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Election status enum
export const electionStatusEnum = pgEnum("election_status", ["draft", "active", "closed"]);

// Elections table
export const elections = pgTable("elections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  status: electionStatusEnum("status").notNull().default("draft"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  position: varchar("position"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Votes table - anonymous voting
export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  voteHash: varchar("vote_hash").notNull().unique(), // For vote verification without revealing voter
  timestamp: timestamp("timestamp").defaultNow(),
});

// Voter eligibility table - track who can vote in which elections
export const voterEligibility = pgTable("voter_eligibility", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  electionId: varchar("election_id").notNull().references(() => elections.id, { onDelete: "cascade" }),
  hasVoted: boolean("has_voted").notNull().default(false),
  voteHash: varchar("vote_hash"), // Links to votes.voteHash for audit trail
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  recordHash: varchar("record_hash").notNull(), // Immutable record hash
  timestamp: timestamp("timestamp").defaultNow(),
});

// Security events table
export const securityEvents = pgTable("security_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: varchar("event_type").notNull(), // login_attempt, vote_cast, suspicious_activity, etc.
  severity: varchar("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  message: text("message").notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userId: varchar("user_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  createdElections: many(elections),
  voterEligibility: many(voterEligibility),
  auditLogs: many(auditLogs),
  securityEvents: many(securityEvents),
}));

export const electionsRelations = relations(elections, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [elections.createdById],
    references: [users.id],
  }),
  candidates: many(candidates),
  votes: many(votes),
  voterEligibility: many(voterEligibility),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  election: one(elections, {
    fields: [candidates.electionId],
    references: [elections.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  election: one(elections, {
    fields: [votes.electionId],
    references: [elections.id],
  }),
  candidate: one(candidates, {
    fields: [votes.candidateId],
    references: [candidates.id],
  }),
}));

export const voterEligibilityRelations = relations(voterEligibility, ({ one }) => ({
  user: one(users, {
    fields: [voterEligibility.userId],
    references: [users.id],
  }),
  election: one(elections, {
    fields: [voterEligibility.electionId],
    references: [elections.id],
  }),
}));

// Insert schemas
export const insertElectionSchema = createInsertSchema(elections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
  recordHash: true,
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  timestamp: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Election = typeof elections.$inferSelect;
export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type VoterEligibility = typeof voterEligibility.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
