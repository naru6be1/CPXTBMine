import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CheckCircle2, RefreshCw } from 'lucide-react';
import BasicSocialLogin from '../components/BasicSocialLogin';
import SimplifiedWeb3Auth from '../components/SimplifiedWeb3Auth';

/**
 * Test page for the social login components
 */
const SocialLoginTestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Social Login Test Page</CardTitle>
            <CardDescription>
              This page lets you test different social login implementations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              <AlertTitle>Simplified Web3Auth Integration</AlertTitle>
              <AlertDescription>
                We've created a completely simplified Web3Auth implementation with minimal 
                configuration to ensure compatibility. This approach removes many of the 
                configuration complexities that were causing initialization issues.
              </AlertDescription>
            </Alert>
            
            <p className="mb-4">
              The simplified Web3Auth implementation follows a "less is more" philosophy, 
              focusing on just the core login functionality without extensive customization.
              The working demo version is still available for comparison.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="simplified" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simplified">Simplified Web3Auth</TabsTrigger>
            <TabsTrigger value="basic">Working Demo</TabsTrigger>
          </TabsList>
          <TabsContent value="simplified" className="mt-4">
            <SimplifiedWeb3Auth />
          </TabsContent>
          <TabsContent value="basic" className="mt-4">
            <BasicSocialLogin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SocialLoginTestPage;