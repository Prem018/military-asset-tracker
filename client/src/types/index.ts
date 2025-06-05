export interface DashboardMetrics {
  openingBalance: number;
  closingBalance: number;
  netMovement: number;
  purchases: number;
  transferIn: number;
  transferOut: number;
  assigned: number;
  expended: number;
}

export interface RecentActivity {
  id: string;
  type: 'purchase' | 'transfer' | 'assignment' | 'expenditure';
  date: string;
  equipment: string;
  quantity: number;
  base: string;
  status: string;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  baseId?: string;
  equipmentTypeId?: string;
}

export interface NetMovementDetails {
  purchases: number;
  transferIn: number;
  transferOut: number;
  transactions: Array<{
    id: string;
    date: string;
    type: 'purchase' | 'transfer_in' | 'transfer_out';
    equipment: string;
    quantity: number;
    impact: number;
  }>;
}
