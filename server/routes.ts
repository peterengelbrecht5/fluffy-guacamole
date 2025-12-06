import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertElectionSchema, insertCandidateSchema, insertVoteSchema } from "@shared/schema";
import { z } from "zod";
import { randomUUID, createHash } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res: Response) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Election routes
  app.get("/api/elections", isAuthenticated, async (req: any, res: Response) => {
    try {
      const elections = await storage.getElections();
      res.json(elections);
    } catch (error) {
      console.error("Error fetching elections:", error);
      res.status(500).json({ message: "Failed to fetch elections" });
    }
  });

  app.get("/api/elections/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const election = await storage.getElection(req.params.id);
      if (!election) {
        return res.status(404).json({ message: "Election not found" });
      }
      res.json(election);
    } catch (error) {
      console.error("Error fetching election:", error);
      res.status(500).json({ message: "Failed to fetch election" });
    }
  });

  app.post("/api/elections", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertElectionSchema.parse(req.body);
      const election = await storage.createElection(validatedData, req.user.claims.sub);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "election_created",
        details: `Created election: ${election.title}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json(election);
    } catch (error) {
      console.error("Error creating election:", error);
      res.status(500).json({ message: "Failed to create election" });
    }
  });

  app.patch("/api/elections/:id/status", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status } = req.body;
      if (!["draft", "active", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateElectionStatus(req.params.id, status);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "election_status_changed",
        details: `Changed election ${req.params.id} status to ${status}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ message: "Election status updated" });
    } catch (error) {
      console.error("Error updating election status:", error);
      res.status(500).json({ message: "Failed to update election status" });
    }
  });

  // Candidate routes
  app.get("/api/elections/:electionId/candidates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const candidates = await storage.getCandidatesByElection(req.params.electionId);
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  app.post("/api/elections/:electionId/candidates", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertCandidateSchema.parse({
        ...req.body,
        electionId: req.params.electionId,
      });

      const candidate = await storage.createCandidate(validatedData);

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "candidate_created",
        details: `Added candidate: ${candidate.name} to election ${req.params.electionId}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json(candidate);
    } catch (error) {
      console.error("Error creating candidate:", error);
      res.status(500).json({ message: "Failed to create candidate" });
    }
  });

  // Voter eligibility routes
  app.get("/api/voter/eligible-elections", isAuthenticated, async (req: any, res: Response) => {
    try {
      const elections = await storage.getEligibleElections(req.user.claims.sub);
      res.json(elections);
    } catch (error) {
      console.error("Error fetching eligible elections:", error);
      res.status(500).json({ message: "Failed to fetch eligible elections" });
    }
  });

  app.post("/api/elections/:electionId/voter-eligibility", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userIds } = req.body;
      if (!Array.isArray(userIds)) {
        return res.status(400).json({ message: "userIds must be an array" });
      }

      const results = [];
      for (const userId of userIds) {
        const eligibility = await storage.createVoterEligibility(userId, req.params.electionId);
        results.push(eligibility);
      }

      res.status(201).json(results);
    } catch (error) {
      console.error("Error creating voter eligibility:", error);
      res.status(500).json({ message: "Failed to create voter eligibility" });
    }
  });

  // Voting routes
  app.post("/api/elections/:electionId/vote", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { candidateId } = req.body;

      // Check voter eligibility
      const eligibility = await storage.checkVoterEligibility(userId, req.params.electionId);
      if (!eligibility) {
        return res.status(403).json({ message: "Not eligible to vote in this election" });
      }

      if (eligibility.hasVoted) {
        return res.status(400).json({ message: "Already voted in this election" });
      }

      // Check if election is active
      const election = await storage.getElection(req.params.electionId);
      if (!election || election.status !== "active") {
        return res.status(400).json({ message: "Election is not active" });
      }

      // Create anonymous vote hash (combines voter id, election id, and candidate id with timestamp)
      const voteData = `${userId}-${req.params.electionId}-${candidateId}-${Date.now()}`;
      const voteHash = createHash("sha256").update(voteData).digest("hex");

      // Cast vote
      const vote = await storage.castVote({
        electionId: req.params.electionId,
        candidateId,
        voteHash,
      });

      // Mark voter as voted
      await storage.markVoterAsVoted(userId, req.params.electionId, voteHash);

      // Create audit log (without revealing who voted for whom)
      await storage.createAuditLog({
        userId,
        action: "vote_cast",
        details: `Vote cast in election ${req.params.electionId}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // Create security event
      await storage.createSecurityEvent({
        eventType: "vote_cast",
        severity: "low",
        message: "Vote cast successfully",
        details: {
          electionId: req.params.electionId,
          voteHash: voteHash.substring(0, 8) + "...", // Partial hash for logging
        },
        ipAddress: req.ip,
        userId,
      });

      res.status(201).json({ 
        message: "Vote cast successfully",
        voteHash: voteHash.substring(0, 8) + "..." // Return partial hash for confirmation
      });
    } catch (error) {
      console.error("Error casting vote:", error);
      
      // Create security event for failed vote
      await storage.createSecurityEvent({
        eventType: "vote_failed",
        severity: "medium",
        message: "Failed to cast vote",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
        ipAddress: req.ip,
        userId: req.user?.claims?.sub,
      });

      res.status(500).json({ message: "Failed to cast vote" });
    }
  });

  // Results routes
  app.get("/api/elections/:electionId/results", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const results = await storage.getElectionResults(req.params.electionId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching election results:", error);
      res.status(500).json({ message: "Failed to fetch election results" });
    }
  });

  // Audit and security routes
  app.get("/api/audit-logs", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/security-events", isAuthenticated, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const events = await storage.getSecurityEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching security events:", error);
      res.status(500).json({ message: "Failed to fetch security events" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
