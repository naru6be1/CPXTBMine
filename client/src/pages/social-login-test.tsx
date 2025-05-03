import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import BasicSocialLogin from '../components/BasicSocialLogin';
import Web3AuthLogin from '../components/Web3AuthLogin';

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
              This page lets you test different implementations of social login functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Updated Web3Auth Implementation</AlertTitle>
              <AlertDescription>
                We've implemented a new version of the Web3Auth integration with improved configuration.
                You can test both the working demo and the latest Web3Auth implementation.
              </AlertDescription>
            </Alert>
            
            <p className="mb-4">
              The working demo version shows how the login flow will work with social accounts,
              while the Web3Auth version implements the actual blockchain wallet integration.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="basic" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Working Demo</TabsTrigger>
            <TabsTrigger value="web3auth">Web3Auth Integration</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="mt-4">
            <BasicSocialLogin />
          </TabsContent>
          <TabsContent value="web3auth" className="mt-4">
            <Web3AuthLogin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SocialLoginTestPage;