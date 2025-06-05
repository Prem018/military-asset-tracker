import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Military Asset Management</h1>
            </div>
            
            <p className="text-center text-muted-foreground">
              Secure asset tracking and management system for military operations.
            </p>
            
            <Button
              onClick={() => window.location.href = "/api/login"}
              className="w-full"
            >
              Sign In to Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
