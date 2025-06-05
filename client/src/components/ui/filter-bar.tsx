import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

export default function FilterBar() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    baseId: "",
    equipmentTypeId: "",
  });

  const { data: bases } = useQuery({
    queryKey: ["/api/bases"],
  });

  const { data: equipmentTypes } = useQuery({
    queryKey: ["/api/equipment-types"],
  });

  const handleApplyFilters = () => {
    // This would trigger a refetch of dashboard data with filters
    console.log("Applying filters:", filters);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48">
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Date Range
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="text-sm"
              />
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-48">
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Base
            </Label>
            <Select 
              value={filters.baseId} 
              onValueChange={(value) => setFilters({ ...filters, baseId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Bases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bases</SelectItem>
                {bases?.map((base: any) => (
                  <SelectItem key={base.id} value={base.id.toString()}>
                    {base.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-48">
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Equipment Type
            </Label>
            <Select 
              value={filters.equipmentTypeId} 
              onValueChange={(value) => setFilters({ ...filters, equipmentTypeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                {equipmentTypes?.map((type: any) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={handleApplyFilters}
              className="bg-primary hover:bg-primary-700 text-white font-medium"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
