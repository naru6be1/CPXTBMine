import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  AlertTriangle 
} from 'lucide-react';

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
  onChallengeFailed = () => {}
}: ChallengeSolverProps) {
  const [answer, setAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get level-based styling
  const getLevelIndicator = () => {
    switch(challenge.level) {
      case 1: return { color: 'text-green-500', label: 'Easy' };
      case 2: return { color: 'text-blue-500', label: 'Basic' };
      case 3: return { color: 'text-yellow-500', label: 'Medium' };
      case 4: return { color: 'text-orange-500', label: 'Hard' };
      case 5: return { color: 'text-red-500', label: 'Extreme' };
      default: return { color: 'text-green-500', label: 'Basic' };
    }
  };
  
  const levelIndicator = getLevelIndicator();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Please enter your answer');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Attempt to make a request with the challenge answer
      const headers: Record<string, string> = {
        'x-math-challenge-token': challenge.token,
        'x-math-challenge-response': answer
      };
      
      // Make any request to verify the challenge
      await fetch('/api/verify-challenge', {
        method: 'GET',
        headers
      });
      
      // If we got here, the challenge was successful
      setIsSubmitting(false);
      onChallengeComplete();
    } catch (err: any) {
      setIsSubmitting(false);
      
      // Handle error response which might contain a new challenge
      if (err.status === 403) {
        try {
          const errorData = await err.json();
          if (errorData && errorData.error) {
            setError(errorData.error);
            onChallengeFailed(errorData.error);
          } else {
            setError('Incorrect answer. Please try again.');
            onChallengeFailed('Incorrect answer');
          }
        } catch (parseErr) {
          setError('Failed to validate your answer. Please try again.');
          onChallengeFailed('Validation error');
        }
      } else {
        setError('Connection error. Please try again.');
        onChallengeFailed('Connection error');
      }
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5" />
        <span>Security Level: </span>
        <span className={`font-medium ${levelIndicator.color}`}>
          {levelIndicator.label}
        </span>
      </div>
      
      <div className="p-4 rounded-md bg-muted/50 text-center">
        <p className="text-lg font-medium mb-1">Solve this equation:</p>
        <p className="text-2xl font-bold">{challenge.equation}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="number"
            placeholder="Enter your answer"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="w-full"
            autoFocus
          />
          {error && (
            <p className="text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Submit Answer
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          <p className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            This security check helps protect our platform from abuse.
          </p>
        </div>
      </form>
    </div>
  );
}

/**
 * Higher-order component to handle global challenge response
 * Used to wrap your entire application or specific routes
 */
export function withChallengeHandler(Component: React.ComponentType<any>) {
  return function WithChallengeHandler(props: any) {
    const [challenge, setChallenge] = useState<Challenge | null>(null);

    // Implement the API request handler that checks for challenges
    const handleApiRequest = async (url: string, options?: RequestInit) => {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (data.challenge) {
              setChallenge(data.challenge);
              throw new Error('Challenge required');
            }
          }
        }
        
        return response;
      } catch (error) {
        if (error instanceof Error && error.message === 'Challenge required') {
          // Don't propagate this error, it's handled by showing the challenge
          throw new Error('Challenge required');
        }
        throw error;
      }
    };

    const handleChallengeComplete = () => {
      setChallenge(null);
    };

    if (challenge) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 border">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Security Verification</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              To protect our service from automated attacks, please solve this quick math problem.
            </p>
            <ChallengeSolver
              challenge={challenge}
              onChallengeComplete={handleChallengeComplete}
            />
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}