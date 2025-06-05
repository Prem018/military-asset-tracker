import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { DashboardFilters } from "@/types";

interface FilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(filters);

  const { data: bases } = useQuery({
    queryKey: ["/api/bases"],
    retry: false,
  });

  const { data: equipmentTypes } = useQuery({
    queryKey: ["/api/equipment-types"],
    retry: false,
  });

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48">
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Date Range
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={localFilters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="block w-full"
              />
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                value={localFilters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="block w-full"
              />
            </div>
          </div>

          <div className="flex-1 min-w-48">
            <Label className="block text-sm font-medium text-charcoal-600 mb-2">
              Base
            </Label>
            <Select
              value={localFilters.baseId || ''}
              onValueChange={(value) => handleFilterChange('baseId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Bases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bases</SelectItem>
                {bases?.map((base: any) => (
                  <SelectItem key={base.id} value={base.id}>
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
              value={localFilters.equipmentTypeId || ''}
              onValueChange={(value) => handleFilterChange('equipmentTypeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                {equipmentTypes?.map((type: any) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleApplyFilters}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
