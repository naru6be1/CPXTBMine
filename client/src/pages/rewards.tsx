import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>
      
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">This feature has been removed</h1>
          <p className="text-muted-foreground mb-6">
            The rewards functionality is no longer available in this application.
          </p>
          <Link href="/">
            <Button>Return to Homepage</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}