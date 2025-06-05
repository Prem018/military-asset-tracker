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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssignmentSchema, insertExpenditureSchema } from "@shared/schema";
import { z } from "zod";
import { UserPlus, MinusCircle } from "lucide-react";

const assignmentFormSchema = insertAssignmentSchema.extend({
  assignmentDate: z.string().min(1, "Assignment date is required"),
  expectedReturnDate: z.string().optional(),
}).omit({ createdBy: true });

const expenditureFormSchema = insertExpenditureSchema.extend({
  expenditureDate: z.string().min(1, "Expenditure date is required"),
}).omit({ authorizedBy: true, createdBy: true });

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;
type ExpenditureFormData = z.infer<typeof expenditureFormSchema>;

export default function Assignments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("assignments");
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);

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

  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      personnelId: "",
      personnelName: "",
      equipmentTypeId: 0,
      itemName: "",
      serialNumber: "",
      baseId: 0,
      assignmentDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: "",
      status: "active",
    },
  });

  const expenditureForm = useForm<ExpenditureFormData>({
    resolver: zodResolver(expenditureFormSchema),
    defaultValues: {
      equipmentTypeId: 0,
      itemName: "",
      quantity: 0,
      baseId: 0,
      reason: "",
      expenditureDate: new Date().toISOString().split('T')[0],
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

  const { data: assignments } = useQuery({
    queryKey: ["/api/assignments"],
    retry: false,
  });

  const { data: expenditures } = useQuery({
    queryKey: ["/api/expenditures"],
    retry: false,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const assignmentData = {
        ...data,
        assignmentDate: new Date(data.assignmentDate),
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
      };
      await apiRequest("POST", "/api/assignments", assignmentData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
      assignmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
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
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      });
    },
  });

  const createExpenditureMutation = useMutation({
    mutationFn: async (data: ExpenditureFormData) => {
      const expenditureData = {
        ...data,
        expenditureDate: new Date(data.expenditureDate),
      };
      await apiRequest("POST", "/api/expenditures", expenditureData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expenditure recorded successfully",
      });
      expenditureForm.reset();
      setShowExpenditureForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/expenditures"] });
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
        description: error.message || "Failed to record expenditure",
        variant: "destructive",
      });
    },
  });

  const updateAssignmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/assignments/${id}/status`, { 
        status, 
        returnDate: status === 'returned' ? new Date().toISOString() : undefined 
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assignment status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
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
        description: error.message || "Failed to update assignment status",
        variant: "destructive",
      });
    },
  });

  const onSubmitAssignment = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate(data);
  };

  const onSubmitExpenditure = (data: ExpenditureFormData) => {
    createExpenditureMutation.mutate(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="assignments" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Assignments & Expenditures</h2>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setShowExpenditureForm(!showExpenditureForm)}
              variant="destructive"
            >
              <MinusCircle className="h-4 w-4 mr-2" />
              Record Expenditure
            </Button>
          </div>
        </div>

        {/* Assignment Form Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Assign Equipment to Personnel</h3>
            <form onSubmit={assignmentForm.handleSubmit(onSubmitAssignment)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Personnel ID</Label>
                <Input
                  {...assignmentForm.register("personnelId")}
                  placeholder="e.g., SOL123456"
                />
                {assignmentForm.formState.errors.personnelId && (
                  <p className="text-sm text-red-600 mt-1">{assignmentForm.formState.errors.personnelId.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Personnel Name</Label>
                <Input
                  {...assignmentForm.register("personnelName")}
                  placeholder="Full Name"
                />
                {assignmentForm.formState.errors.personnelName && (
                  <p className="text-sm text-red-600 mt-1">{assignmentForm.formState.errors.personnelName.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Equipment Type</Label>
                <Select
                  value={assignmentForm.watch("equipmentTypeId").toString()}
                  onValueChange={(value) => assignmentForm.setValue("equipmentTypeId", parseInt(value))}
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
                {assignmentForm.formState.errors.equipmentTypeId && (
                  <p className="text-sm text-red-600 mt-1">{assignmentForm.formState.errors.equipmentTypeId.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Specific Item</Label>
                <Input
                  {...assignmentForm.register("itemName")}
                  placeholder="e.g., M4A1 Carbine"
                />
                {assignmentForm.formState.errors.itemName && (
                  <p className="text-sm text-red-600 mt-1">{assignmentForm.formState.errors.itemName.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Serial Number</Label>
                <Input
                  {...assignmentForm.register("serialNumber")}
                  placeholder="Equipment Serial #"
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Base</Label>
                <Select
                  value={assignmentForm.watch("baseId").toString()}
                  onValueChange={(value) => assignmentForm.setValue("baseId", parseInt(value))}
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
                {assignmentForm.formState.errors.baseId && (
                  <p className="text-sm text-red-600 mt-1">{assignmentForm.formState.errors.baseId.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Assignment Date</Label>
                <Input
                  type="date"
                  {...assignmentForm.register("assignmentDate")}
                />
                {assignmentForm.formState.errors.assignmentDate && (
                  <p className="text-sm text-red-600 mt-1">{assignmentForm.formState.errors.assignmentDate.message}</p>
                )}
              </div>
              
              <div>
                <Label className="block text-sm font-medium mb-2">Expected Return</Label>
                <Input
                  type="date"
                  {...assignmentForm.register("expectedReturnDate")}
                />
              </div>
              
              <div className="lg:col-span-4 flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => assignmentForm.reset()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createAssignmentMutation.isPending}
                >
                  {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Expenditure Form Card */}
        {showExpenditureForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Record Equipment Expenditure</h3>
              <form onSubmit={expenditureForm.handleSubmit(onSubmitExpenditure)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">Equipment Type</Label>
                  <Select
                    value={expenditureForm.watch("equipmentTypeId").toString()}
                    onValueChange={(value) => expenditureForm.setValue("equipmentTypeId", parseInt(value))}
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
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-2">Specific Item</Label>
                  <Input
                    {...expenditureForm.register("itemName")}
                    placeholder="e.g., 5.56mm Ammunition"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-2">Quantity</Label>
                  <Input
                    type="number"
                    {...expenditureForm.register("quantity", { valueAsNumber: true })}
                    placeholder="0"
                    min="1"
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-2">Base</Label>
                  <Select
                    value={expenditureForm.watch("baseId").toString()}
                    onValueChange={(value) => expenditureForm.setValue("baseId", parseInt(value))}
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
                </div>
                
                <div>
                  <Label className="block text-sm font-medium mb-2">Expenditure Date</Label>
                  <Input
                    type="date"
                    {...expenditureForm.register("expenditureDate")}
                  />
                </div>
                
                <div className="lg:col-span-3">
                  <Label className="block text-sm font-medium mb-2">Reason</Label>
                  <Input
                    {...expenditureForm.register("reason")}
                    placeholder="e.g., Training Exercise"
                  />
                </div>
                
                <div className="lg:col-span-3 flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      expenditureForm.reset();
                      setShowExpenditureForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createExpenditureMutation.isPending}
                    variant="destructive"
                  >
                    {createExpenditureMutation.isPending ? "Recording..." : "Record Expenditure"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Assignments & Expenditures Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="px-6">
                <TabsTrigger value="assignments">Active Assignments</TabsTrigger>
                <TabsTrigger value="expenditures">Expenditures History</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Active Assignments Table */}
            <TabsContent value="assignments">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personnel</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments?.filter((a: any) => a.status === 'active')?.length ? (
                      assignments.filter((a: any) => a.status === 'active').map((assignment: any) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="text-sm font-medium">{assignment.personnelName}</div>
                            <div className="text-sm text-muted-foreground">{assignment.personnelId}</div>
                          </TableCell>
                          <TableCell className="text-sm">{assignment.itemName}</TableCell>
                          <TableCell className="text-sm">{assignment.serialNumber || '-'}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(assignment.assignmentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {assignment.expectedReturnDate ? new Date(assignment.expectedReturnDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {bases?.find((base: any) => base.id === assignment.baseId)?.name || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateAssignmentStatusMutation.mutate({ id: assignment.id, status: 'returned' })}
                                disabled={updateAssignmentStatusMutation.isPending}
                              >
                                Return
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No active assignments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Expenditures Table */}
            <TabsContent value="expenditures">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Base</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenditures?.length ? (
                      expenditures.map((expenditure: any) => (
                        <TableRow key={expenditure.id}>
                          <TableCell className="text-sm">
                            {new Date(expenditure.expenditureDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">{expenditure.itemName}</TableCell>
                          <TableCell className="text-sm">{expenditure.quantity}</TableCell>
                          <TableCell className="text-sm">{expenditure.reason}</TableCell>
                          <TableCell className="text-sm">
                            {bases?.find((base: any) => base.id === expenditure.baseId)?.name || 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No expenditures found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
