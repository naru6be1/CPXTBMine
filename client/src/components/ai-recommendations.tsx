import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { Brain, CheckCircle, Circle, HelpCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Recommendation {
  id: number;
  content: string;
  isRead: boolean;
  isImplemented: boolean;
  createdAt: string;
}

export function AIRecommendations() {
  const { address } = useWallet();

  const { data: recommendationsData, isLoading } = useQuery({
    queryKey: ['recommendations', address],
    queryFn: async () => {
      if (!address) return { recommendations: [] };
      const response = await fetch(`/api/users/${address}/recommendations`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      return response.json();
    },
    enabled: !!address
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/recommendations/${id}/read`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to mark recommendation as read');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', address] });
    }
  });

  const implementRecommendationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/recommendations/${id}/implement`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to implement recommendation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', address] });
    }
  });

  if (!address) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading AI recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  const recommendations = recommendationsData?.recommendations || [];

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI-Powered Recommendations
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-muted/50">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-3">
                <p className="text-sm leading-relaxed">
                  Our AI analyzes your mining behavior and provides personalized recommendations to help optimize your rewards and strategy.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((recommendation: Recommendation) => (
              <Card key={recommendation.id} className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm mb-2">{recommendation.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(recommendation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!recommendation.isRead && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(recommendation.id)}
                              className="hover:bg-muted"
                            >
                              <Circle className="h-4 w-4 mr-1" />
                              Mark as Read
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="p-3">
                            <p className="text-sm">Click to acknowledge you've read this recommendation</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {recommendation.isRead && !recommendation.isImplemented && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => implementRecommendationMutation.mutate(recommendation.id)}
                              className="hover:bg-muted"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Implement
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="p-3">
                            <p className="text-sm">Click when you've followed this recommendation to track your progress</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}