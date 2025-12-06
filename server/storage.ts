import {
  users,
  elections,
  candidates,
  votes,
  voterEligibility,
  auditLogs,
  securityEvents,
  type User,
  type UpsertUser,
  type Election,
  type InsertElection,
  type Candidate,
  type InsertCandidate,
  type Vote,
  type InsertVote,
  type VoterEligibility,
  type AuditLog,
  type InsertAuditLog,
  type SecurityEvent,
  type InsertSecurityEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Election operations
  createElection(election: InsertElection, createdById: string): Promise<Election>;
  getElections(): Promise<Election[]>;
  getElection(id: string): Promise<Election | undefined>;
  updateElectionStatus(id: string, status: "draft" | "active" | "closed"): Promise<void>;
  
  // Candidate operations
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidatesByElection(electionId: string): Promise<Candidate[]>;
  
  // Vote operations
  castVote(vote: InsertVote): Promise<Vote>;
  getVotesByElection(electionId: string): Promise<Vote[]>;
  getElectionResults(electionId: string): Promise<Array<{ candidateId: string; candidateName: string; voteCount: number }>>;
  
  // Voter eligibility operations
  createVoterEligibility(userId: string, electionId: string): Promise<VoterEligibility>;
  checkVoterEligibility(userId: string, electionId: string): Promise<VoterEligibility | undefined>;
  markVoterAsVoted(userId: string, electionId: string, voteHash: string): Promise<void>;
  getEligibleElections(userId: string): Promise<Election[]>;
  
  // Audit and security operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent>;
  getSecurityEvents(limit?: number): Promise<SecurityEvent[]>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    activeElections: number;
    totalVotes: number;
    totalUsers: number;
    recentVotes: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Election operations
  async createElection(election: InsertElection, createdById: string): Promise<Election> {
    const [newElection] = await db
      .insert(elections)
      .values({
        ...election,
        createdById,
      })
      .returning();
    return newElection;
  }

  async getElections(): Promise<Election[]> {
    return await db.select().from(elections).orderBy(desc(elections.createdAt));
  }

  async getElection(id: string): Promise<Election | undefined> {
    const [election] = await db.select().from(elections).where(eq(elections.id, id));
    return election;
  }

  async updateElectionStatus(id: string, status: "draft" | "active" | "closed"): Promise<void> {
    await db.update(elections).set({ status }).where(eq(elections.id, id));
  }

  // Candidate operations
  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db.insert(candidates).values(candidate).returning();
    return newCandidate;
  }

  async getCandidatesByElection(electionId: string): Promise<Candidate[]> {
    return await db.select().from(candidates).where(eq(candidates.electionId, electionId));
  }

  // Vote operations
  async castVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db.insert(votes).values(vote).returning();
    return newVote;
  }

  async getVotesByElection(electionId: string): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.electionId, electionId));
  }

  async getElectionResults(electionId: string): Promise<Array<{ candidateId: string; candidateName: string; voteCount: number }>> {
    const results = await db
      .select({
        candidateId: votes.candidateId,
        candidateName: candidates.name,
        voteCount: count(votes.id),
      })
      .from(votes)
      .innerJoin(candidates, eq(votes.candidateId, candidates.id))
      .where(eq(votes.electionId, electionId))
      .groupBy(votes.candidateId, candidates.name);

    return results.map(r => ({
      candidateId: r.candidateId,
      candidateName: r.candidateName,
      voteCount: Number(r.voteCount),
    }));
  }

  // Voter eligibility operations
  async createVoterEligibility(userId: string, electionId: string): Promise<VoterEligibility> {
    const [eligibility] = await db
      .insert(voterEligibility)
      .values({
        userId,
        electionId,
      })
      .returning();
    return eligibility;
  }

  async checkVoterEligibility(userId: string, electionId: string): Promise<VoterEligibility | undefined> {
    const [eligibility] = await db
      .select()
      .from(voterEligibility)
      .where(and(eq(voterEligibility.userId, userId), eq(voterEligibility.electionId, electionId)));
    return eligibility;
  }

  async markVoterAsVoted(userId: string, electionId: string, voteHash: string): Promise<void> {
    await db
      .update(voterEligibility)
      .set({ hasVoted: true, voteHash })
      .where(and(eq(voterEligibility.userId, userId), eq(voterEligibility.electionId, electionId)));
  }

  async getEligibleElections(userId: string): Promise<Election[]> {
    const eligibleElections = await db
      .select({
        election: elections,
      })
      .from(voterEligibility)
      .innerJoin(elections, eq(voterEligibility.electionId, elections.id))
      .where(and(
        eq(voterEligibility.userId, userId),
        eq(voterEligibility.hasVoted, false),
        eq(elections.status, "active")
      ));

    return eligibleElections.map(e => e.election);
  }

  // Audit and security operations
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const recordHash = randomUUID(); // In production, use proper cryptographic hash
    const [log] = await db
      .insert(auditLogs)
      .values({
        ...auditLog,
        recordHash,
      })
      .returning();
    return log;
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  async createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent> {
    const [securityEvent] = await db.insert(securityEvents).values(event).returning();
    return securityEvent;
  }

  async getSecurityEvents(limit: number = 20): Promise<SecurityEvent[]> {
    return await db
      .select()
      .from(securityEvents)
      .orderBy(desc(securityEvents.timestamp))
      .limit(limit);
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    activeElections: number;
    totalVotes: number;
    totalUsers: number;
    recentVotes: number;
  }> {
    const [activeElections] = await db
      .select({ count: count(elections.id) })
      .from(elections)
      .where(eq(elections.status, "active"));

    const [totalVotes] = await db
      .select({ count: count(votes.id) })
      .from(votes);

    const [totalUsers] = await db
      .select({ count: count(users.id) })
      .from(users);

    const [recentVotes] = await db
      .select({ count: count(votes.id) })
      .from(votes)
      .where(sql`${votes.timestamp} >= NOW() - INTERVAL '24 hours'`);

    return {
      activeElections: Number(activeElections.count),
      totalVotes: Number(totalVotes.count),
      totalUsers: Number(totalUsers.count),
      recentVotes: Number(recentVotes.count),
    };
  }
}

export const storage = new DatabaseStorage();
