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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPurchaseSchema } from "@shared/schema";
import { z } from "zod";
import { Plus } from "lucide-react";

const purchaseFormSchema = insertPurchaseSchema.extend({
  purchaseDate: z.string().min(1, "Purchase date is required"),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

export default function Purchases() {
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

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      equipmentTypeId: 0,
      itemName: "",
      quantity: 0,
      baseId: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: "",
      purchaseOrderNumber: "",
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

  const { data: purchases, refetch: refetchPurchases } = useQuery({
    queryKey: ["/api/purchases"],
    retry: false,
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const purchaseData = {
        ...data,
        purchaseDate: new Date(data.purchaseDate),
      };
      await apiRequest("POST", "/api/purchases", purchaseData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase recorded successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
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
        description: error.message || "Failed to record purchase",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseFormData) => {
    createPurchaseMutation.mutate(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="purchases" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Asset Purchases</h2>
        </div>

        {/* Purchase Form Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Record New Purchase</h3>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  placeholder="e.g., M4A1 Carbine"
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
                <Label className="block text-sm font-medium mb-2">Destination Base</Label>
                <Select
                  value={form.watch("baseId").toString()}
                  onValueChange={(value) => form.setValue("baseId", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Base" />
                  </SelectTrigger>
                  <SelectContent>
                    {bases?.map((base: any) => (
                      <SelectItem key={base.id} value={base.id.toString()}>{base.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.baseId && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.baseId.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Label className="block text-sm font-medium mb-2">Purchase Date</Label>
                <Input
                  type="date"
                  {...form.register("purchaseDate")}
                />
                {form.formState.errors.purchaseDate && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.purchaseDate.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Label className="block text-sm font-medium mb-2">Purchase Order Number</Label>
                <Input
                  {...form.register("purchaseOrderNumber")}
                  placeholder="Optional PO number"
                />
              </div>

              <div className="lg:col-span-4">
                <Label className="block text-sm font-medium mb-2">Notes</Label>
                <Input
                  {...form.register("notes")}
                  placeholder="Optional notes"
                />
              </div>
              
              <div className="lg:col-span-4 flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPurchaseMutation.isPending}
                >
                  {createPurchaseMutation.isPending ? "Recording..." : "Record Purchase"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Purchase History Table */}
        <Card>
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-foreground">Purchase History</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.length ? (
                  purchases.map((purchase: any) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-sm">
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">{purchase.itemName}</TableCell>
                      <TableCell className="text-sm">{purchase.quantity}</TableCell>
                      <TableCell className="text-sm">
                        {bases?.find((base: any) => base.id === purchase.baseId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm">{purchase.purchaseOrderNumber || '-'}</TableCell>
                      <TableCell className="text-sm">{purchase.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No purchases found
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
