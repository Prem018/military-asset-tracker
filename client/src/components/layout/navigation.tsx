import { useAuth } from "@/hooks/useAuth";
import { Shield, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  currentPage: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || "User";
  };

  const getRoleDisplay = (role?: string) => {
    const roleMap: Record<string, string> = {
      admin: "Administrator",
      base_commander: "Base Commander", 
      logistics_officer: "Logistics Officer",
    };
    return roleMap[role || ""] || "User";
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "fas fa-chart-line",
      path: "/",
    },
    {
      id: "purchases", 
      label: "Purchases",
      icon: "fas fa-shopping-cart",
      path: "/purchases",
    },
    {
      id: "transfers",
      label: "Transfers", 
      icon: "fas fa-exchange-alt",
      path: "/transfers",
    },
    {
      id: "assignments",
      label: "Assignments & Expenditures",
      icon: "fas fa-user-tag", 
      path: "/assignments",
    },
  ];

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-semibold text-gray-900">Military Asset Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 text-sm rounded-lg p-2 hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {getInitials(user?.firstName, user?.lastName)}
                      </span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
                      <p className="text-xs text-gray-500">{getRoleDisplay(user?.role)}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link key={item.id} href={item.path}>
                <span
                  className={`${
                    currentPage === item.id
                      ? "border-b-2 border-primary text-primary"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } py-4 px-1 text-sm font-medium transition-colors flex items-center cursor-pointer`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
