import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChallengeSolver } from "@/components/challenge-solver";
import { InfoIcon } from "lucide-react";

export default function ChallengeDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<{
    token: string;
    equation: string;
    level: number;
  } | null>(null);
  
  // Simulating network requests that might trigger the challenge
  const makeRequests = async (count: number) => {
    setIsLoading(true);
    setMessage(null);
    setError(null);
    
    try {
      // In a real app, this would be an actual API call
      // Here we're just simulating a response with a challenge
      if (count > 20) {
        // Simulate a challenge response from the server
        setChallenge({
          token: "demo-token-" + Math.random().toString(36).substring(7),
          equation: `${Math.floor(Math.random() * 20)} + ${Math.floor(Math.random() * 20)} = ?`,
          level: Math.min(5, Math.floor(count / 10))
        });
        setError("Too many requests. Please solve the security challenge to continue.");
      } else {
        setMessage(`${count} requests made successfully. Try making more to trigger the challenge!`);
      }
    } catch (err) {
      setError("An error occurred while making requests.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChallengeComplete = () => {
    setChallenge(null);
    setMessage("Challenge completed successfully! You can now continue using the application.");
  };
  
  const handleChallengeFailed = (error: string) => {
    setError(`Challenge failed: ${error}`);
    // In a real application, we would increase the difficulty or issue a new challenge
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">DDoS Protection Challenge Demo</h1>
      
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
            <CardDescription>
              This demonstrates the progressive mathematical challenge system for DDoS protection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Server-side Protection</AlertTitle>
              <AlertDescription>
                When too many requests are detected from the same client, the server issues 
                mathematical challenges of increasing difficulty. The client must solve these
                challenges to continue making requests.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h3 className="font-medium">Challenge Levels:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-medium">Level 1:</span> Simple addition (e.g., 5 + 3 = ?)</li>
                <li><span className="font-medium">Level 2:</span> Addition and subtraction with larger numbers</li>
                <li><span className="font-medium">Level 3:</span> Includes multiplication</li>
                <li><span className="font-medium">Level 4:</span> Includes division and more terms</li>
                <li><span className="font-medium">Level 5:</span> Complex calculations with multiple operations</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start space-y-4">
            <div className="flex space-x-4">
              <Button onClick={() => makeRequests(10)} disabled={isLoading || !!challenge}>
                Make 10 Requests
              </Button>
              <Button onClick={() => makeRequests(25)} disabled={isLoading || !!challenge} variant="secondary">
                Make 25 Requests (Trigger Challenge)
              </Button>
              <Button onClick={() => makeRequests(50)} disabled={isLoading || !!challenge} variant="destructive">
                Make 50 Requests (High Difficulty)
              </Button>
            </div>
            
            {message && <p className="text-green-600 dark:text-green-400">{message}</p>}
            {error && !challenge && <p className="text-red-600 dark:text-red-400">{error}</p>}
          </CardFooter>
        </Card>
        
        {challenge && (
          <ChallengeSolver 
            challenge={challenge}
            onChallengeComplete={handleChallengeComplete}
            onChallengeFailed={handleChallengeFailed}
          />
        )}
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Real-World Implementation</CardTitle>
            <CardDescription>
              How this would be integrated in a production environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Server-side:</h3>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
{`// Apply middleware to Express application
app.use(mathChallengeMiddleware(
  30,      // Request threshold
  60000,   // Time window (1 minute)
  ['/api'], // Protected paths
  ['/api/health'] // Excluded paths
));`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Client-side:</h3>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
{`// Handle 429 responses with challenges
const response = await fetch('/api/data');

if (response.status === 429) {
  const data = await response.json();
  if (data.challenge) {
    // Show challenge UI to the user
    // After solving:
    await fetch('/api/data', {
      headers: {
        'X-Math-Challenge-Token': data.challenge.token,
        'X-Math-Challenge-Response': userSolution
      }
    });
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}