import { Card, CardContent } from "@/components/ui/card";
import { PackageOpen, Package, ArrowUpDown, UserCheck, MinusCircle } from "lucide-react";
import type { DashboardMetrics } from "@/types";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  onNetMovementClick: () => void;
}

export function MetricsCards({ metrics, onNetMovementClick }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {/* Opening Balance Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PackageOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Opening Balance</h3>
              <p className="text-2xl font-semibold text-charcoal-700">
                {metrics.openingBalance.toLocaleString()}
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
                <Package className="w-6 h-6 text-military-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Closing Balance</h3>
              <p className="text-2xl font-semibold text-charcoal-700">
                {metrics.closingBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Movement Card (Clickable) */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onNetMovementClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ArrowUpDown className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Net Movement</h3>
              <p className={`text-2xl font-semibold ${
                metrics.netMovement >= 0 ? 'text-military-600' : 'text-red-600'
              }`}>
                {metrics.netMovement >= 0 ? '+' : ''}{metrics.netMovement.toLocaleString()}
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
                <UserCheck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Assigned</h3>
              <p className="text-2xl font-semibold text-charcoal-700">
                {metrics.assigned.toLocaleString()}
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
                <MinusCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Expended</h3>
              <p className="text-2xl font-semibold text-charcoal-700">
                {metrics.expended.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
