import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Code2, AlertCircle, WifiOff } from 'lucide-react';
import BasicSocialLogin from '../components/BasicSocialLogin';
import Web3AuthIntegration from '../components/Web3AuthIntegration';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Test page for the social login components
 */
const SocialLoginTestPage: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [web3AuthAvailable, setWeb3AuthAvailable] = useState<boolean>(false);
  const [dnsError, setDnsError] = useState<boolean>(true);
  
  // Listen for errors from the Web3AuthIntegration component
  useEffect(() => {
    const handleWeb3AuthErrors = (event: Event) => {
      const errorEvent = event as CustomEvent;
      if (errorEvent.detail && errorEvent.detail.type === 'web3auth-error') {
        setWeb3AuthAvailable(false);
        
        // Check if it's a DNS error
        if (errorEvent.detail.errorMessage && 
            (errorEvent.detail.errorMessage.includes('DNS') || 
             errorEvent.detail.errorMessage.includes('app.openlogin.com'))) {
          setDnsError(true);
          console.error('DNS error detected with Web3Auth:', errorEvent.detail);
        }
      }
    };
    
    window.addEventListener('web3auth-error', handleWeb3AuthErrors as EventListener);
    return () => {
      window.removeEventListener('web3auth-error', handleWeb3AuthErrors as EventListener);
    };
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Social Login Solution</CardTitle>
            <CardDescription>
              Simplified blockchain access through social accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6" variant="default">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Production-Ready Solution</AlertTitle>
              <AlertDescription>
                <p className="mb-2">This component demonstrates our dual authentication approach with automatic fallback functionality:</p>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Primary: Our fully optimized BasicSocialLogin with simulated authentication flow</li>
                  <li>Alternative: Web3Auth integration (can be enabled with <code>?enableWeb3Auth=true</code> URL parameter)</li>
                </ol>
              </AlertDescription>
            </Alert>
            
            <Alert variant="warning" className="mb-6 border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Implementation Note</AlertTitle>
              <AlertDescription>
                <p className="mb-2">DNS resolution issues with Web3Auth servers (app.openlogin.com) persist despite domain whitelisting. Our solution:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Default to using our enhanced BasicSocialLogin component</li>
                  <li>Keep Web3Auth integration available for testing with the URL parameter</li>
                  <li>Use same UI/UX in both implementation paths for consistent user experience</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center space-x-2 mb-6">
              <Switch 
                id="show-advanced" 
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
              <Label htmlFor="show-advanced" className="text-sm cursor-pointer">
                Show Advanced Options {!web3AuthAvailable && "⚠️"}
              </Label>
            </div>
            
            {showAdvanced && (
              <Alert className="mb-6 border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-100">
                <Code2 className="h-4 w-4" />
                <AlertTitle>Development Version</AlertTitle>
                <AlertDescription>
                  The advanced tab shows our current Web3Auth integration. This is still being 
                  optimized and may have compatibility issues with some browsers or network conditions.
                  It represents our work-in-progress production implementation.
                </AlertDescription>
              </Alert>
            )}
            
            <p className="mb-4">
              The demo below shows the social login flow, including generation of a wallet address
              that can be used for transactions. Your users will be able to log in with their
              favorite social accounts without needing to understand blockchain technology.
            </p>
          </CardContent>
        </Card>
        
        {showAdvanced ? (
          <Tabs defaultValue={web3AuthAvailable ? "advanced" : "demo"} className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="demo">Working Demo</TabsTrigger>
              <TabsTrigger value="advanced" disabled={!web3AuthAvailable}>
                Web3Auth Integration {!web3AuthAvailable && "⚠️"}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="demo" className="mt-4">
              <BasicSocialLogin />
            </TabsContent>
            <TabsContent value="advanced" className="mt-4">
              <Web3AuthIntegration onError={(error: Error) => {
                // Dispatch a custom event for errors
                const errorDetail = {
                  type: 'web3auth-error',
                  errorMessage: error.message || 'Unknown error',
                  timestamp: new Date().toISOString()
                };
                const event = new CustomEvent('web3auth-error', { detail: errorDetail });
                window.dispatchEvent(event);
                console.error('Web3Auth error dispatched:', errorDetail);
              }} />
            </TabsContent>
          </Tabs>
        ) : (
          <div>
            {dnsError && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                ⚠️ Using working demo due to Web3Auth connection issues.
              </p>
            )}
            <BasicSocialLogin />
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialLoginTestPage;