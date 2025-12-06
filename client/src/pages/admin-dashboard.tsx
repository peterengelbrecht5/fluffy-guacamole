import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { SecurityStatusCard } from "@/components/security-status-card";
import { CreateElectionDialog } from "@/components/create-election-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Vote, 
  TrendingUp, 
  Users, 
  Shield, 
  ClipboardList,
  BarChart3,
  Download,
  RefreshCw,
  Edit,
  Clock,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.title = "Admin Dashboard - SecureVote";
  }, []);

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
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

  // Fetch elections
  const { data: elections = [], isLoading: electionsLoading } = useQuery({
    queryKey: ["/api/elections"],
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

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["/api/audit-logs"],
    enabled: activeTab === "audit",
  });

  // Fetch security events
  const { data: securityEvents = [] } = useQuery({
    queryKey: ["/api/security-events"], 
    enabled: activeTab === "security",
  });

  const updateElectionStatusMutation = useMutation({
    mutationFn: async ({ electionId, status }: { electionId: string; status: string }) => {
      await apiRequest("PATCH", `/api/elections/${electionId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Election status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update election status",
        variant: "destructive",
      });
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/elections"] });
    toast({
      title: "Data Refreshed",
      description: "Dashboard data has been updated",
    });
  };

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export will be ready shortly",
    });
  };

  const getElectionStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-vote-secondary text-white"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getThreatLevelFromEvents = () => {
    if (!securityEvents.length) return "low";
    const severities = securityEvents.map(e => e.severity);
    if (severities.includes("critical")) return "critical";
    if (severities.includes("high")) return "high";
    if (severities.includes("medium")) return "medium";
    return "low";
  };

  return (
    <div className="min-h-screen bg-vote-surface">
      <NavigationHeader notificationCount={3} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-5" data-testid="tabs-dashboard">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="elections" data-testid="tab-elections">
              <Vote className="w-4 h-4 mr-2" />
              Elections
            </TabsTrigger>
            <TabsTrigger value="voters" data-testid="tab-voters">
              <Users className="w-4 h-4 mr-2" />
              Voters
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">
              <ClipboardList className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <SecurityStatusCard
                encryptionStatus="active"
                lastSecurityScan="2 hours ago"
                threatLevel={getThreatLevelFromEvents()}
              />

              {/* Active Elections Card */}
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="card-active-elections">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Active Elections</CardTitle>
                  <div className="bg-vote-primary text-white p-2 rounded-lg">
                    <Vote className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-vote-primary mb-2" data-testid="text-active-count">
                    {metricsLoading ? "..." : metrics?.activeElections || 0}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {elections.filter(e => new Date(e.endDate) > new Date() && e.status === "active").length} ending soon
                  </p>
                  <CreateElectionDialog />
                </CardContent>
              </Card>

              {/* Vote Activity Card */}
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="card-vote-activity">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Vote Activity</CardTitle>
                  <div className="bg-vote-secondary text-white p-2 rounded-lg">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-vote-secondary mb-2" data-testid="text-total-votes">
                    {metricsLoading ? "..." : metrics?.totalVotes || 0}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {metricsLoading ? "..." : metrics?.recentVotes || 0} votes cast today
                  </p>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-vote-secondary mr-1" />
                    <span className="text-vote-secondary font-medium">12%</span>
                    <span className="text-gray-600 ml-1">vs yesterday</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Elections Tab */}
          <TabsContent value="elections" className="space-y-6">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-900">Current Elections</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportData}
                      data-testid="button-export-data"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshData}
                      data-testid="button-refresh-data"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {electionsLoading ? (
                  <div className="p-6 text-center text-gray-500">Loading elections...</div>
                ) : elections.length === 0 ? (
                  <div className="p-6 text-center text-gray-500" data-testid="text-no-elections">
                    No elections found. Create your first election to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200" data-testid="table-elections">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Election</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {elections.map((election) => (
                          <tr key={election.id} className="hover:bg-gray-50" data-testid={`row-election-${election.id}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-vote-primary flex items-center justify-center">
                                    <Vote className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900" data-testid={`text-election-title-${election.id}`}>
                                    {election.title}
                                  </div>
                                  <div className="text-sm text-gray-500" data-testid={`text-election-description-${election.id}`}>
                                    {election.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4" data-testid={`status-election-${election.id}`}>
                              {getElectionStatusBadge(election.status)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900" data-testid={`date-election-${election.id}`}>
                              {format(new Date(election.endDate), "MMM dd, yyyy")}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-vote-primary hover:text-blue-700"
                                data-testid={`button-view-results-${election.id}`}
                              >
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Results
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-800"
                                data-testid={`button-edit-election-${election.id}`}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="card-security-events">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Security Events</CardTitle>
                <p className="text-sm text-gray-600">Real-time security monitoring</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {securityEvents.length === 0 ? (
                    <div className="text-center text-gray-500 py-8" data-testid="text-no-security-events">
                      No recent security events
                    </div>
                  ) : (
                    securityEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className={`flex items-start space-x-3 p-3 rounded-lg ${
                          event.severity === 'low' ? 'bg-gray-50' :
                          event.severity === 'medium' ? 'bg-yellow-50' :
                          event.severity === 'high' ? 'bg-red-50' :
                          'bg-red-100'
                        }`}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.severity === 'low' ? 'bg-vote-secondary' :
                            event.severity === 'medium' ? 'bg-vote-warning' :
                            'bg-vote-error'
                          }`}>
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900" data-testid={`event-message-${event.id}`}>
                            {event.message}
                          </p>
                          <p className="text-xs text-gray-500" data-testid={`event-details-${event.id}`}>
                            {event.timestamp && format(new Date(event.timestamp), "MMM dd, yyyy HH:mm")} • 
                            IP: {event.ipAddress || "Unknown"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="card-audit-trail">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Audit Trail</CardTitle>
                <p className="text-sm text-gray-600">Immutable voting records</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {auditLogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8" data-testid="text-no-audit-logs">
                      No audit logs available
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="border-l-4 border-vote-primary pl-4"
                        data-testid={`audit-log-${log.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900" data-testid={`audit-action-${log.id}`}>
                              {log.action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-gray-500 mt-1" data-testid={`audit-details-${log.id}`}>
                              {log.details}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500" data-testid={`audit-timestamp-${log.id}`}>
                            {log.timestamp && format(new Date(log.timestamp), "HH:mm:ss")}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs" data-testid={`audit-hash-${log.id}`}>
                            Hash: {log.recordHash?.substring(0, 16)}...
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={exportData}
                    data-testid="button-download-audit-report"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download Audit Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voters Tab */}
          <TabsContent value="voters" className="space-y-6">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="card-voters">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-semibold text-gray-900">Voter Management</CardTitle>
                <p className="text-sm text-gray-600">Manage voter eligibility and access</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center text-gray-500 py-8" data-testid="text-voter-management">
                  Voter management features coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
