import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Shield, Bell } from "lucide-react";

interface NavigationHeaderProps {
  notificationCount?: number;
}

export function NavigationHeader({ notificationCount = 0 }: NavigationHeaderProps) {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleNotifications = () => {
    // TODO: Implement notifications panel
    console.log("Show notifications");
  };

  return (
    <nav className="bg-white shadow-md border-b-2 border-vote-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Vote className="text-vote-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-vote-primary" data-testid="text-app-name">
                SecureVote
              </span>
            </div>
            <span className="hidden sm:block text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <Shield className="w-4 h-4 text-vote-secondary mr-1 inline" />
              Certified Secure Platform
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden md:block text-sm text-gray-600" data-testid="text-user-info">
                <Badge 
                  className="bg-vote-primary text-white text-xs mr-2"
                  data-testid="badge-user-role"
                >
                  {(user as any).role?.toUpperCase()}
                </Badge>
                <span data-testid="text-user-name">
                  {(user as any).firstName} {(user as any).lastName}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="relative bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
              onClick={handleNotifications}
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notificationCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 bg-vote-error text-white text-xs w-5 h-5 rounded-full p-0 flex items-center justify-center"
                  data-testid="badge-notification-count"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
            <Button
              className="bg-vote-error hover:bg-red-700 text-white px-4 py-2 transition-colors"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
