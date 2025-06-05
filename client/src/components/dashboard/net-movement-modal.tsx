import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, ArrowLeft } from "lucide-react";
import type { NetMovementDetails } from "@/types";

interface NetMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: NetMovementDetails;
}

export function NetMovementModal({ isOpen, onClose, data }: NetMovementModalProps) {
  if (!data) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Plus className="w-4 h-4" />;
      case 'transfer_in':
        return <ArrowRight className="w-4 h-4" />;
      case 'transfer_out':
        return <ArrowLeft className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'default';
      case 'transfer_in':
        return 'secondary';
      case 'transfer_out':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchase';
      case 'transfer_in':
        return 'Transfer In';
      case 'transfer_out':
        return 'Transfer Out';
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-charcoal-700">
            Net Movement Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Purchases Summary */}
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-500">Purchases</h4>
                    <p className="text-2xl font-semibold text-blue-600">
                      +{data.purchases.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer In Summary */}
            <Card className="bg-military-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-military-100 rounded-lg flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-military-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-500">Transfer In</h4>
                    <p className="text-2xl font-semibold text-military-600">
                      +{data.transferIn.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Out Summary */}
            <Card className="bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-500">Transfer Out</h4>
                    <p className="text-2xl font-semibold text-red-600">
                      {data.transferOut.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Transactions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No transactions found for the selected period
                    </td>
                  </tr>
                ) : (
                  data.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-700">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getTypeVariant(transaction.type)} className="flex items-center gap-1 w-fit">
                          {getTypeIcon(transaction.type)}
                          {formatType(transaction.type)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-700">
                        {transaction.equipment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-700">
                        {transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={transaction.impact >= 0 ? 'text-military-600' : 'text-red-600'}>
                          {transaction.impact >= 0 ? '+' : ''}{transaction.impact}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
