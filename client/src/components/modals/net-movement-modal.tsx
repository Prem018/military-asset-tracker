import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, ArrowLeft } from "lucide-react";

interface NetMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics?: {
    purchases: number;
    transferIn: number;
    transferOut: number;
    netMovement: number;
  };
}

export default function NetMovementModal({ isOpen, onClose, metrics }: NetMovementModalProps) {
  const getStatusBadge = (type: string) => {
    const statusColors: Record<string, string> = {
      'Purchase': 'bg-blue-100 text-blue-800',
      'Transfer In': 'bg-green-100 text-green-800', 
      'Transfer Out': 'bg-red-100 text-red-800',
    };
    
    return statusColors[type] || 'bg-gray-100 text-gray-800';
  };

  // Mock detailed transactions for demonstration
  const detailedTransactions = [
    {
      id: 1,
      date: new Date('2024-12-15'),
      type: 'Purchase',
      equipment: 'M4A1 Carbine',
      quantity: 25,
      impact: 25,
    },
    {
      id: 2,
      date: new Date('2024-12-14'),
      type: 'Transfer In',
      equipment: 'Night Vision Goggles',
      quantity: 12,
      impact: 12,
    },
    {
      id: 3,
      date: new Date('2024-12-13'),
      type: 'Transfer Out',
      equipment: 'HMMWV',
      quantity: 2,
      impact: -2,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">Net Movement Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Purchases Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-500">Purchases</h4>
                  <p className="text-2xl font-semibold text-blue-600">+{metrics?.purchases?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>

            {/* Transfer In Summary */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-500">Transfer In</h4>
                  <p className="text-2xl font-semibold text-green-600">+{metrics?.transferIn?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>

            {/* Transfer Out Summary */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowLeft className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-500">Transfer Out</h4>
                  <p className="text-2xl font-semibold text-red-600">-{metrics?.transferOut?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Transactions Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedTransactions.length ? (
                  detailedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {transaction.date.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{transaction.equipment}</TableCell>
                      <TableCell className="text-sm">{transaction.quantity}</TableCell>
                      <TableCell className={`text-sm font-medium ${transaction.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.impact > 0 ? '+' : ''}{transaction.impact}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No detailed transaction data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
