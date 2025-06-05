import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransferSchema } from "@shared/schema";
import { z } from "zod";
import { ArrowRightLeft } from "lucide-react";

const transferFormSchema = insertTransferSchema.extend({
  transferDate: z.string().min(1, "Transfer date is required"),
}).omit({ transferNumber: true, createdBy: true });

type TransferFormData = z.infer<typeof transferFormSchema>;

export default function Transfers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      equipmentTypeId: 0,
      itemName: "",
      quantity: 0,
      fromBaseId: 0,
      toBaseId: 0,
      transferDate: new Date().toISOString().split('T')[0],
      reason: "",
      status: "pending",
    },
  });

  const { data: bases } = useQuery({
    queryKey: ["/api/bases"],
    retry: false,
  });

  const { data: equipmentTypes } = useQuery({
    queryKey: ["/api/equipment-types"],
    retry: false,
  });

  const { data: transfers, refetch: refetchTransfers } = useQuery({
    queryKey: ["/api/transfers"],
    retry: false,
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: TransferFormData) => {
      const transferData = {
        ...data,
        transferDate: new Date(data.transferDate),
      };
      await apiRequest("POST", "/api/transfers", transferData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer initiated successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to initiate transfer",
        variant: "destructive",
      });
    },
  });

  const updateTransferStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/transfers/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
    },
    onError: (error: Error) => {
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
        description: error.message || "Failed to update transfer status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransferFormData) => {
    if (data.fromBaseId === data.toBaseId) {
      toast({
        title: "Error",
        description: "Source and destination bases cannot be the same",
        variant: "destructive",
      });
      return;
    }
    createTransferMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_transit': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'pending': 'Pending',
      'in_transit': 'In Transit',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    
    return statusLabels[status] || status;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="transfers" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Asset Transfers</h2>
        </div>

        {/* Transfer Form Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Initiate Asset Transfer</h3>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-2">From Base</Label>
                <Select
                  value={form.watch("fromBaseId").toString()}
                  onValueChange={(value) => form.setValue("fromBaseId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Source Base" />
                  </SelectTrigger>
                  <SelectContent>
                    {bases?.map((base: any) => (
                      <SelectItem key={base.id} value={base.id.toString()}>{base.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.fromBaseId && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.fromBaseId.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">To Base</Label>
                <Select
                  value={form.watch("toBaseId").toString()}
                  onValueChange={(value) => form.setValue("toBaseId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Destination Base" />
                  </SelectTrigger>
                  <SelectContent>
                    {bases?.map((base: any) => (
                      <SelectItem key={base.id} value={base.id.toString()}>{base.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.toBaseId && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.toBaseId.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Equipment Type</Label>
                <Select
                  value={form.watch("equipmentTypeId").toString()}
                  onValueChange={(value) => form.setValue("equipmentTypeId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypes?.map((type: any) => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.equipmentTypeId && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.equipmentTypeId.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Specific Item</Label>
                <Input
                  {...form.register("itemName")}
                  placeholder="e.g., HMMWV"
                />
                {form.formState.errors.itemName && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.itemName.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Quantity</Label>
                <Input
                  type="number"
                  {...form.register("quantity", { valueAsNumber: true })}
                  placeholder="0"
                  min="1"
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.quantity.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Transfer Date</Label>
                <Input
                  type="date"
                  {...form.register("transferDate")}
                />
                {form.formState.errors.transferDate && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.transferDate.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <Label className="block text-sm font-medium mb-2">Transfer Reason</Label>
                <Textarea
                  {...form.register("reason")}
                  rows={3}
                  placeholder="Reason for transfer"
                />
                {form.formState.errors.reason && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.reason.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createTransferMutation.isPending}
                >
                  {createTransferMutation.isPending ? "Initiating..." : "Initiate Transfer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Transfer History Table */}
        <Card>
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-foreground">Transfer History</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers?.length ? (
                  transfers.map((transfer: any) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="text-sm font-medium">{transfer.transferNumber}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(transfer.transferDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">{transfer.itemName}</TableCell>
                      <TableCell className="text-sm">{transfer.quantity}</TableCell>
                      <TableCell className="text-sm">
                        {bases?.find((base: any) => base.id === transfer.fromBaseId)?.name || 'Unknown'} → {bases?.find((base: any) => base.id === transfer.toBaseId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(transfer.status)}>
                          {getStatusLabel(transfer.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transfer.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTransferStatusMutation.mutate({ id: transfer.id, status: 'in_transit' })}
                              disabled={updateTransferStatusMutation.isPending}
                            >
                              Start
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateTransferStatusMutation.mutate({ id: transfer.id, status: 'cancelled' })}
                              disabled={updateTransferStatusMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {transfer.status === 'in_transit' && (
                          <Button
                            size="sm"
                            onClick={() => updateTransferStatusMutation.mutate({ id: transfer.id, status: 'completed' })}
                            disabled={updateTransferStatusMutation.isPending}
                          >
                            Complete
                          </Button>
                        )}
                        {(transfer.status === 'completed' || transfer.status === 'cancelled') && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No transfers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}
