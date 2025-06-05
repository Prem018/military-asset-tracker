import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const purchaseSchema = z.object({
  equipmentTypeId: z.string().min(1, "Equipment type is required"),
  baseId: z.string().min(1, "Base is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  purchaseOrder: z.string().optional(),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  notes: z.string().optional(),
});

type PurchaseForm = z.infer<typeof purchaseSchema>;

interface PurchaseFormProps {
  onCancel: () => void;
}

export default function PurchaseForm({ onCancel }: PurchaseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bases } = useQuery({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      const response = await fetch('/api/bases', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch bases');
      return response.json();
    },
  });

  const { data: equipmentTypes } = useQuery({
    queryKey: ['/api/equipment-types'],
    queryFn: async () => {
      const response = await fetch('/api/equipment-types', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch equipment types');
      return response.json();
    },
  });

  const form = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      equipmentTypeId: "",
      baseId: "",
      quantity: 1,
      purchaseOrder: "",
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseForm) => {
      return await apiRequest('POST', '/api/purchases', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/activity'] });
      onCancel();
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
        description: "Failed to record purchase",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseForm) => {
    createPurchaseMutation.mutate(data);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Record New Purchase</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="block text-sm font-medium text-gray-600 mb-2">Equipment Type</Label>
            <Select value={form.watch('equipmentTypeId')} onValueChange={(value) => form.setValue('equipmentTypeId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipmentTypes?.map((equipmentType: any) => (
                  <SelectItem key={equipmentType.id} value={equipmentType.id}>
                    {equipmentType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.equipmentTypeId && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.equipmentTypeId.message}</p>
            )}
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-600 mb-2">Quantity</Label>
            <Input
              type="number"
              min="1"
              {...form.register('quantity', { valueAsNumber: true })}
              placeholder="0"
            />
            {form.formState.errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.quantity.message}</p>
            )}
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-600 mb-2">Destination Base</Label>
            <Select value={form.watch('baseId')} onValueChange={(value) => form.setValue('baseId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Base" />
              </SelectTrigger>
              <SelectContent>
                {bases?.map((base: any) => (
                  <SelectItem key={base.id} value={base.id}>
                    {base.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.baseId && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.baseId.message}</p>
            )}
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-600 mb-2">Purchase Date</Label>
            <Input
              type="date"
              {...form.register('purchaseDate')}
            />
            {form.formState.errors.purchaseDate && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.purchaseDate.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label className="block text-sm font-medium text-gray-600 mb-2">Purchase Order</Label>
            <Input
              {...form.register('purchaseOrder')}
              placeholder="Optional purchase order number"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="block text-sm font-medium text-gray-600 mb-2">Notes</Label>
            <Input
              {...form.register('notes')}
              placeholder="Optional notes"
            />
          </div>

          <div className="lg:col-span-4 flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPurchaseMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createPurchaseMutation.isPending ? "Recording..." : "Record Purchase"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
