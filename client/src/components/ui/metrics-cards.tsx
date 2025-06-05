import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, PackageOpen, ArrowUpDown, UserCheck, MinusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import NetMovementModal from "@/components/modals/net-movement-modal";

export default function MetricsCards() {
  const [showNetMovementModal, setShowNetMovementModal] = useState(false);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = metrics || {
    openingBalance: 0,
    closingBalance: 0,
    netMovement: 0,
    assigned: 0,
    expended: 0,
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Opening Balance Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PackageOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Opening Balance</h3>
                <p className="text-2xl font-semibold text-charcoal-700">
                  {metricsData.openingBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Closing Balance Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-military-50 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-military-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Closing Balance</h3>
                <p className="text-2xl font-semibold text-charcoal-700">
                  {metricsData.closingBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Movement Card (Clickable) */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowNetMovementModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ArrowUpDown className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Net Movement</h3>
                <p className="text-2xl font-semibold text-military-600">
                  {metricsData.netMovement >= 0 ? '+' : ''}{metricsData.netMovement.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">Click for details</p>
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
                <h3 className="text-sm font-medium text-gray-500">Assigned</h3>
                <p className="text-2xl font-semibold text-charcoal-700">
                  {metricsData.assigned.toLocaleString()}
                </p>
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
                <h3 className="text-sm font-medium text-gray-500">Expended</h3>
                <p className="text-2xl font-semibold text-charcoal-700">
                  {metricsData.expended.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <NetMovementModal 
        isOpen={showNetMovementModal}
        onClose={() => setShowNetMovementModal(false)}
        metrics={metricsData}
      />
    </>
  );
}
