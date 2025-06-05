import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, User } from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "base_commander":
        return "Base Commander";
      case "logistics_officer":
        return "Logistics Officer";
      default:
        return "User";
    }
  };

  return (
    <header className="bg-surface shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-semibold text-charcoal-700">
                Military Asset Management
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm rounded-lg p-2 hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-charcoal-700">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "User"
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {getRoleDisplay(user?.role)}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
