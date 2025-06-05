import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function RecentActivityTable() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge className="bg-blue-100 text-blue-800">Purchase</Badge>;
      case 'transfer':
        return <Badge className="bg-purple-100 text-purple-800">Transfer</Badge>;
      case 'assignment':
        return <Badge className="bg-orange-100 text-orange-800">Assignment</Badge>;
      case 'expenditure':
        return <Badge className="bg-red-100 text-red-800">Expenditure</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-military-50 text-military-600">Completed</Badge>;
      case 'in_transit':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-800">In Transit</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'assigned':
        return <Badge className="bg-military-50 text-military-600">Assigned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recent activity...</p>
          </div>
        ) : !activity || activity.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No recent activity to display.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
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
                      Base
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activity.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-700">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActivityBadge(item.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-700">
                        {item.equipment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-700">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-700">
                        {item.base}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {activity.length} recent activities
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
