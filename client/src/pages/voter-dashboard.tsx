import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { VoteConfirmationModal } from "@/components/vote-confirmation-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Vote, Shield, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function VoterDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    electionId?: string;
    candidateId?: string;
    candidateName?: string;
    electionTitle?: string;
  }>({ isOpen: false });

  useEffect(() => {
    document.title = "Voter Dashboard - SecureVote";
  }, []);

  // Fetch eligible elections
  const { data: elections = [], isLoading: electionsLoading } = useQuery({
    queryKey: ["/api/voter/eligible-elections"],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Fetch candidates for each election
  const candidateQueries = elections.map(election => 
    useQuery({
      queryKey: ["/api/elections", election.id, "candidates"],
      enabled: !!election.id,
    })
  );

  const castVoteMutation = useMutation({
    mutationFn: async ({ electionId, candidateId }: { electionId: string; candidateId: string }) => {
      const response = await apiRequest("POST", `/api/elections/${electionId}/vote`, { candidateId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Vote Cast Successfully",
        description: `Your vote has been recorded. Confirmation: ${data.voteHash}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/voter/eligible-elections"] });
      setConfirmationModal({ isOpen: false });
      setSelectedVotes(prev => {
        const newVotes = { ...prev };
        delete newVotes[confirmationModal.electionId || ""];
        return newVotes;
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to cast vote",
          variant: "destructive",
        });
      }
    },
  });

  const handleVoteSelection = (electionId: string, candidateId: string) => {
    setSelectedVotes(prev => ({
      ...prev,
      [electionId]: candidateId
    }));
  };

  const handleSubmitVote = (electionId: string, electionTitle: string) => {
    const candidateId = selectedVotes[electionId];
    if (!candidateId) {
      toast({
        title: "No Candidate Selected",
        description: "Please select a candidate before submitting your vote",
        variant: "destructive",
      });
      return;
    }

    // Find candidate name
    const candidatesQuery = candidateQueries.find(q => 
      q.data && q.data.some((c: any) => c.electionId === electionId)
    );
    const candidate = candidatesQuery?.data?.find((c: any) => c.id === candidateId);

    setConfirmationModal({
      isOpen: true,
      electionId,
      candidateId,
      candidateName: candidate?.name,
      electionTitle,
    });
  };

  const confirmVote = () => {
    if (confirmationModal.electionId && confirmationModal.candidateId) {
      castVoteMutation.mutate({
        electionId: confirmationModal.electionId,
        candidateId: confirmationModal.candidateId,
      });
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    if (end <= now) return "Ended";
    return formatDistanceToNow(end, { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-vote-surface">
      <NavigationHeader notificationCount={0} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-dashboard-title">
            Available Elections
          </h1>
          <p className="text-lg text-gray-600" data-testid="text-dashboard-subtitle">
            Cast your secure, anonymous vote
          </p>
        </div>

        {electionsLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600" data-testid="text-loading">
              Loading available elections...
            </div>
          </div>
        ) : elections.length === 0 ? (
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="text-center py-12">
              <Vote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-no-elections">
                No Elections Available
              </h3>
              <p className="text-gray-600" data-testid="text-no-elections-desc">
                There are currently no active elections that you're eligible to vote in.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {elections.map((election, index) => {
              const candidatesQuery = candidateQueries[index];
              const candidates = candidatesQuery?.data || [];
              const selectedCandidate = selectedVotes[election.id];
              
              return (
                <Card 
                  key={election.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  data-testid={`card-election-${election.id}`}
                >
                  <CardHeader className="border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-900" data-testid={`title-election-${election.id}`}>
                          {election.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1" data-testid={`desc-election-${election.id}`}>
                          {election.description}
                        </p>
                      </div>
                      <Badge className="bg-vote-secondary text-white text-xs px-3 py-1 rounded-full" data-testid={`time-remaining-${election.id}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {getTimeRemaining(election.endDate)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {candidatesQuery?.isLoading ? (
                      <div className="text-center py-8 text-gray-600" data-testid={`loading-candidates-${election.id}`}>
                        Loading candidates...
                      </div>
                    ) : candidates.length === 0 ? (
                      <div className="text-center py-8 text-gray-600" data-testid={`no-candidates-${election.id}`}>
                        No candidates available for this election.
                      </div>
                    ) : (
                      <>
                        <RadioGroup
                          value={selectedCandidate || ""}
                          onValueChange={(value) => handleVoteSelection(election.id, value)}
                          className="space-y-3 mb-6"
                          data-testid={`radio-group-${election.id}`}
                        >
                          {candidates.map((candidate: any) => (
                            <div 
                              key={candidate.id}
                              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                              data-testid={`candidate-option-${candidate.id}`}
                            >
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value={candidate.id} id={candidate.id} />
                                <Label 
                                  htmlFor={candidate.id} 
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900" data-testid={`candidate-name-${candidate.id}`}>
                                        {candidate.name}
                                      </div>
                                      {candidate.position && (
                                        <div className="text-xs text-gray-500" data-testid={`candidate-position-${candidate.id}`}>
                                          {candidate.position}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {candidate.description && (
                                    <p className="text-sm text-gray-600 mt-1" data-testid={`candidate-desc-${candidate.id}`}>
                                      {candidate.description}
                                    </p>
                                  )}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>

                        <div className="flex justify-between items-center">
                          <Alert className="flex-1 mr-4">
                            <Shield className="h-4 w-4 text-vote-secondary" />
                            <AlertDescription className="text-sm">
                              Your vote is encrypted and anonymous
                            </AlertDescription>
                          </Alert>
                          
                          <Button
                            onClick={() => handleSubmitVote(election.id, election.title)}
                            disabled={!selectedCandidate}
                            className="bg-vote-primary hover:bg-blue-700 text-white px-6 py-2 transition-colors"
                            data-testid={`button-submit-vote-${election.id}`}
                          >
                            <Vote className="w-4 h-4 mr-2" />
                            Cast Vote
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <VoteConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false })}
        onConfirm={confirmVote}
        selectedCandidate={confirmationModal.candidateName}
        electionTitle={confirmationModal.electionTitle}
        isLoading={castVoteMutation.isPending}
      />
    </div>
  );
}
