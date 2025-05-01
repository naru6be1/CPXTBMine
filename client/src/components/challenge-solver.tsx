import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface Challenge {
  token: string;
  equation: string;
  level: number;
}

interface ChallengeSolverProps {
  challenge: Challenge;
  onChallengeComplete: () => void;
  onChallengeFailed?: (error: string) => void;
}

/**
 * A component that helps users solve mathematical challenges issued by the server
 * for DDoS protection
 */
export function ChallengeSolver({ 
  challenge, 
  onChallengeComplete, 
  onChallengeFailed 
}: ChallengeSolverProps) {
  const [answer, setAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  
  // Handle countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (onChallengeFailed) {
        onChallengeFailed("Challenge expired. Please try again.");
      }
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, onChallengeFailed]);
  
  const submitSolution = async () => {
    if (!answer || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Make the original request again, but with challenge response
      const response = await fetch(window.location.pathname, {
        headers: {
          'X-Math-Challenge-Token': challenge.token,
          'X-Math-Challenge-Response': answer
        }
      });
      
      if (response.ok) {
        onChallengeComplete();
      } else {
        const data = await response.json();
        
        if (data.newChallenge) {
          // Wrong answer, but we got a new challenge
          // The parent component should handle this by updating the challenge prop
          if (onChallengeFailed) {
            onChallengeFailed("Incorrect answer. Please try again.");
          }
        } else {
          setError(data.error || "An error occurred. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getDifficultyLabel = (level: number) => {
    switch(level) {
      case 1: return "Easy";
      case 2: return "Basic";
      case 3: return "Moderate";
      case 4: return "Challenging";
      case 5: return "Difficult";
      default: return "Unknown";
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Security Challenge</CardTitle>
        <CardDescription>
          Our system detected unusual traffic. Please solve this math problem to continue.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Difficulty: {getDifficultyLabel(challenge.level)}
          </span>
          <span className="text-sm text-muted-foreground">
            Time left: {formatTimeLeft()}
          </span>
        </div>
        
        <div className="text-center mb-6 p-4 bg-muted rounded-md">
          <span className="text-xl font-mono">{challenge.equation}</span>
        </div>
        
        <div className="space-y-4">
          <Input
            type="number"
            placeholder="Enter your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="text-center text-lg"
          />
          
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={submitSolution}
          disabled={isSubmitting || !answer}
        >
          {isSubmitting ? "Checking..." : "Submit Answer"}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Higher-order component to handle global challenge response
 * Used to wrap your entire application or specific routes
 */
export function withChallengeHandler(Component: React.ComponentType<any>) {
  return function WithChallengeHandler(props: any) {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleApiRequest = async (url: string, options?: RequestInit) => {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          // Too many requests, server is asking us to solve a challenge
          const data = await response.json();
          if (data.challenge) {
            setChallenge(data.challenge);
            return null;
          }
        }
        
        return response;
      } catch (error) {
        console.error("API request error:", error);
        throw error;
      }
    };
    
    const handleChallengeComplete = () => {
      setChallenge(null);
      // Optionally reload the current page or refetch data
    };
    
    const handleChallengeFailed = (error: string) => {
      console.error("Challenge failed:", error);
      // Could implement retry logic here
    };
    
    if (challenge) {
      return (
        <ChallengeSolver
          challenge={challenge}
          onChallengeComplete={handleChallengeComplete}
          onChallengeFailed={handleChallengeFailed}
        />
      );
    }
    
    return <Component {...props} apiRequest={handleApiRequest} />;
  };
}

export default ChallengeSolver;