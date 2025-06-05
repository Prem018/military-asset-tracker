import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function TransferForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    fromBaseId: "",
    toBaseId: "",
    equipmentTypeId: "",
    quantity: "",
    transferDate: "",
    reason: "",
  });

  const { data: bases } = useQuery({
    queryKey: ["/api/bases"],
  });

  const { data: equipmentTypes } = useQuery({
    queryKey: ["/api/equipment-types"],
  });

  const createTransfer = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/transfers", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer initiated successfully",
      });
      setFormData({
        fromBaseId: "",
        toBaseId: "",
        equipmentTypeId: "",
        quantity: "",
        transferDate: "",
        reason: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
        description: "Failed to initiate transfer",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromBaseId || !formData.toBaseId || !formData.equipmentTypeId || 
        !formData.quantity || !formData.transferDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.fromBaseId === formData.toBaseId) {
      toast({
        title: "Error",
        description: "Source and destination bases cannot be the same",
        variant: "destructive",
      });
      return;
    }

    createTransfer.mutate({
      fromBaseId: parseInt(formData.fromBaseId),
      toBaseId: parseInt(formData.toBaseId),
      equipmentTypeId: parseInt(formData.equipmentTypeId),
      quantity: parseInt(formData.quantity),
      transferDate: formData.transferDate,
      reason: formData.reason || null,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Initiate Asset Transfer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              From Base *
            </Label>
            <Select 
              value={formData.fromBaseId} 
              onValueChange={(value) => setFormData({ ...formData, fromBaseId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Source Base" />
              </SelectTrigger>
              <SelectContent>
                {bases?.map((base: any) => (
                  <SelectItem key={base.id} value={base.id.toString()}>
                    {base.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              To Base *
            </Label>
            <Select 
              value={formData.toBaseId} 
              onValueChange={(value) => setFormData({ ...formData, toBaseId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Destination Base" />
              </SelectTrigger>
              <SelectContent>
                {bases?.map((base: any) => (
                  <SelectItem key={base.id} value={base.id.toString()}>
                    {base.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Equipment Type *
            </Label>
            <Select 
              value={formData.equipmentTypeId} 
              onValueChange={(value) => setFormData({ ...formData, equipmentTypeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipmentTypes?.map((type: any) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Quantity *
            </Label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Transfer Date *
            </Label>
            <Input
              type="date"
              value={formData.transferDate}
              onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3">
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Transfer Reason
            </Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for transfer"
              rows={3}
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setFormData({
                fromBaseId: "",
                toBaseId: "",
                equipmentTypeId: "",
                quantity: "",
                transferDate: "",
                reason: "",
              })}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTransfer.isPending}
              className="bg-primary hover:bg-primary-700 text-white"
            >
              {createTransfer.isPending ? "Initiating..." : "Initiate Transfer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
