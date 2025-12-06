import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BarChart3, Download, ArrowLeft, Trophy, Users } from "lucide-react";
import { format } from "date-fns";

export default function ElectionResults() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Election Results - SecureVote";
  }, []);

  // Fetch election details
  const { data: election, isLoading: electionLoading } = useQuery({
    queryKey: ["/api/elections", id],
    enabled: !!id,
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

  // Fetch election results
  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/elections", id, "results"],
    enabled: !!id,
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

  const goBack = () => {
    setLocation("/");
  };

  const exportResults = () => {
    toast({
      title: "Export Started",
      description: "Election results export will be ready shortly",
    });
  };

  const totalVotes = results.reduce((sum: number, result: any) => sum + result.voteCount, 0);
  const winner = results.length > 0 ? results.reduce((prev: any, current: any) => 
    prev.voteCount > current.voteCount ? prev : current
  ) : null;

  if (electionLoading || resultsLoading) {
    return (
      <div className="min-h-screen bg-vote-surface">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12" data-testid="loading-results">
            <div className="text-lg text-gray-600">Loading election results...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-vote-surface">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12" data-testid="election-not-found">
            <div className="text-lg text-gray-600">Election not found</div>
            <Button onClick={goBack} className="mt-4">Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vote-surface">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={goBack} 
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-election-title">
                {election.title}
              </h1>
              <p className="text-lg text-gray-600 mb-4" data-testid="text-election-description">
                {election.description}
              </p>
              <div className="flex items-center space-x-4">
                <Badge 
                  className={`${
                    election.status === "active" ? "bg-vote-secondary" :
                    election.status === "closed" ? "bg-gray-500" :
                    "bg-vote-warning"
                  } text-white`}
                  data-testid="badge-election-status"
                >
                  {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                </Badge>
                <span className="text-sm text-gray-600" data-testid="text-end-date">
                  Ended: {format(new Date(election.endDate), "MMM dd, yyyy 'at' HH:mm")}
                </span>
              </div>
            </div>
            
            <Button onClick={exportResults} data-testid="button-export-results">
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Results Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-total-votes">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-votes">
                {totalVotes.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-candidates">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidates</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-candidate-count">
                {results.length}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-winner">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leading Candidate</CardTitle>
              <Trophy className="h-4 w-4 text-vote-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate" data-testid="text-winner-name">
                {winner?.candidateName || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground" data-testid="text-winner-votes">
                {winner ? `${winner.voteCount} votes` : "No votes yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results Chart */}
        <Card data-testid="card-results-chart">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Election Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12" data-testid="text-no-votes">
                <div className="text-lg text-gray-600">No votes have been cast yet</div>
              </div>
            ) : (
              <div className="space-y-6">
                {results
                  .sort((a: any, b: any) => b.voteCount - a.voteCount)
                  .map((result: any, index: number) => {
                    const percentage = totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0;
                    const isWinner = result.candidateId === winner?.candidateId;
                    
                    return (
                      <div 
                        key={result.candidateId} 
                        className={`p-4 rounded-lg border-2 ${isWinner ? 'border-vote-warning bg-yellow-50' : 'border-gray-200'}`}
                        data-testid={`result-${result.candidateId}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            {isWinner && <Trophy className="w-5 h-5 text-vote-warning mr-2" />}
                            <div>
                              <h3 className="text-lg font-semibold" data-testid={`candidate-name-${result.candidateId}`}>
                                {result.candidateName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Position #{index + 1}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" data-testid={`vote-count-${result.candidateId}`}>
                              {result.voteCount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600" data-testid={`percentage-${result.candidateId}`}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-3"
                          data-testid={`progress-${result.candidateId}`}
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
