import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SecurityStatusCardProps {
  encryptionStatus: "active" | "inactive";
  lastSecurityScan: string;
  threatLevel: "low" | "medium" | "high" | "critical";
}

export function SecurityStatusCard({ 
  encryptionStatus, 
  lastSecurityScan, 
  threatLevel 
}: SecurityStatusCardProps) {
  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-vote-secondary text-white";
      case "medium": return "bg-vote-warning text-white";
      case "high": return "bg-vote-error text-white";
      case "critical": return "bg-red-800 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200" data-testid="card-security-status">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          System Security
        </CardTitle>
        <div className="bg-vote-secondary text-white p-2 rounded-lg">
          <Shield className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Encryption Status</span>
          <span 
            className={`font-medium ${encryptionStatus === 'active' ? 'text-vote-secondary' : 'text-vote-error'}`}
            data-testid="text-encryption-status"
          >
            {encryptionStatus === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Last Security Scan</span>
          <span className="text-gray-900 font-medium" data-testid="text-last-scan">
            {lastSecurityScan}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Threat Level</span>
          <Badge 
            className={`text-xs px-2 py-1 rounded-full ${getThreatLevelColor(threatLevel)}`}
            data-testid="badge-threat-level"
          >
            {threatLevel.toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
