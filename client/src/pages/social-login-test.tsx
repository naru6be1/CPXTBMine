import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import BasicSocialLogin from '../components/BasicSocialLogin';
import SimpleSocialLoginV2 from '../components/SimpleSocialLoginV2';

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
            <Alert variant="warning" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Web3Auth Integration Issue</AlertTitle>
              <AlertDescription>
                We're encountering issues with the Web3Auth integration related to the privateKeyProvider configuration.
                While we resolve this, we've provided a basic demo version that simulates the login flow.
              </AlertDescription>
            </Alert>
            
            <p className="mb-4">
              The working demo version shows how the login flow will work with social accounts,
              while the Web3Auth version shows our progress on the actual blockchain integration.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="basic" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Working Demo</TabsTrigger>
            <TabsTrigger value="web3auth">Web3Auth (In Progress)</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="mt-4">
            <BasicSocialLogin />
          </TabsContent>
          <TabsContent value="web3auth" className="mt-4">
            <SimpleSocialLoginV2 />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SocialLoginTestPage;