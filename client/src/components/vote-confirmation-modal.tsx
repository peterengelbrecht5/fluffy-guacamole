import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Vote, AlertTriangle } from "lucide-react";

interface VoteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCandidate?: string;
  electionTitle?: string;
  isLoading?: boolean;
}

export function VoteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedCandidate,
  electionTitle,
  isLoading = false
}: VoteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-vote-confirmation">
        <DialogHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-vote-primary mb-4">
            <Vote className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-lg font-medium text-gray-900">
            Confirm Your Vote
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            You are about to cast your vote for{" "}
            <strong data-testid="text-selected-candidate">{selectedCandidate}</strong>{" "}
            in the {electionTitle} election.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="bg-yellow-50 border-vote-warning">
          <AlertTriangle className="h-4 w-4 text-vote-warning" />
          <AlertDescription className="text-xs text-gray-700">
            <strong>Important:</strong> Once submitted, your vote cannot be changed. 
            Your vote will be encrypted and stored anonymously.
          </AlertDescription>
        </Alert>

        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
            data-testid="button-cancel-vote"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-vote-primary hover:bg-blue-700"
            data-testid="button-confirm-vote"
          >
            {isLoading ? "Processing..." : "Confirm Vote"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
