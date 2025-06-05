import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import NetMovementModal from "@/components/modals/net-movement-modal";
import { 
  Box, 
  Package, 
  ArrowUpDown, 
  UserCheck, 
  MinusCircle,
  Calendar,
  MapPin,
  Wrench
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [filters, setFilters] = useState({
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    baseId: "",
    equipmentTypeId: "",
  });
  const [showNetMovementModal, setShowNetMovementModal] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: bases } = useQuery({
    queryKey: ["/api/bases"],
    retry: false,
  });

  const { data: equipmentTypes } = useQuery({
    queryKey: ["/api/equipment-types"],
    retry: false,
  });

  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ["/api/dashboard/metrics", filters],
    retry: false,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
    retry: false,
  });

  const applyFilters = () => {
    refetchMetrics();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-800',
      'In Transit': 'bg-yellow-100 text-yellow-800',
      'Assigned': 'bg-green-100 text-green-800',
      'Purchase': 'bg-blue-100 text-blue-800',
      'Transfer': 'bg-purple-100 text-purple-800',
      'Assignment': 'bg-orange-100 text-orange-800',
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-48">
                <Label className="block text-sm font-medium mb-2">Date Range</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="text-sm"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="flex-1 min-w-48">
                <Label className="block text-sm font-medium mb-2">Base</Label>
                <Select value={filters.baseId} onValueChange={(value) => setFilters(prev => ({ ...prev, baseId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Bases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bases</SelectItem>
                    {bases?.map((base: any) => (
                      <SelectItem key={base.id} value={base.id.toString()}>{base.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 min-w-48">
                <Label className="block text-sm font-medium mb-2">Equipment Type</Label>
                <Select value={filters.equipmentTypeId} onValueChange={(value) => setFilters(prev => ({ ...prev, equipmentTypeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    {equipmentTypes?.map((type: any) => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={applyFilters} className="font-medium">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Opening Balance Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Box className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Opening Balance</h3>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.openingBalance?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Closing Balance Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Closing Balance</h3>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.closingBalance?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Movement Card (Clickable) */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowNetMovementModal(true)}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ArrowUpDown className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Net Movement</h3>
                  <p className="text-2xl font-semibold text-green-600">+{metrics?.netMovement?.toLocaleString() || '0'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click for details</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Assets Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Assigned</h3>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.assigned?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expended Assets Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <MinusCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Expended</h3>
                  <p className="text-2xl font-semibold text-foreground">{metrics?.expended?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card>
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-foreground">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity?.length ? (
                  recentActivity.map((activity: any) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-sm">
                        {new Date(activity.date).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(activity.type)}>
                          {activity.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{activity.equipment}</TableCell>
                      <TableCell className="text-sm">{activity.quantity}</TableCell>
                      <TableCell className="text-sm">{activity.base}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(activity.status)}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No recent activity found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {recentActivity?.length > 0 && (
            <div className="px-6 py-3 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing recent activity
                </p>
              </div>
            </div>
          )}
        </Card>
      </main>

      <NetMovementModal 
        isOpen={showNetMovementModal}
        onClose={() => setShowNetMovementModal(false)}
        metrics={metrics}
      />
    </div>
  );
}
