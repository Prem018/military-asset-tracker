import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";
import type { DashboardFilters } from "@/pages/dashboard";

interface PurchaseHistoryProps {
  filters: DashboardFilters;
}

export default function PurchaseHistory({ filters }: PurchaseHistoryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['/api/purchases', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.baseId) params.append('baseId', filters.baseId);
      if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/purchases?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch purchases');
      return response.json();
    },
  });

  const { data: bases } = useQuery({
    queryKey: ['/api/bases'],
  });

  const { data: equipmentTypes } = useQuery({
    queryKey: ['/api/equipment-types'],
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/purchases/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/activity'] });
    },
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
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete purchase",
        variant: "destructive",
      });
    },
  });

  const getBaseName = (baseId: string) => {
    return bases?.find((base: any) => base.id === baseId)?.name || baseId;
  };

  const getEquipmentTypeName = (equipmentTypeId: string) => {
    return equipmentTypes?.find((type: any) => type.id === equipmentTypeId)?.name || equipmentTypeId;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Purchase History</h3>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Purchase History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No purchases found
                  </td>
                </tr>
              ) : (
                purchases?.map((purchase: any) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {format(new Date(purchase.purchaseDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getEquipmentTypeName(purchase.equipmentTypeId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {purchase.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getBaseName(purchase.baseId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {purchase.purchaseOrder || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                          onClick={() => deletePurchaseMutation.mutate(purchase.id)}
                          disabled={deletePurchaseMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
