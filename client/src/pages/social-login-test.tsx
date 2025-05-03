import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CheckCircle2 } from 'lucide-react';
import BasicSocialLogin from '../components/BasicSocialLogin';
import Web3AuthLoginV3 from '../components/Web3AuthLoginV3';

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
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>New Web3Auth Implementation</AlertTitle>
              <AlertDescription>
                We've rebuilt the Web3Auth integration with the latest package versions (6.1.4) and added
                the required EthereumPrivateKeyProvider that was missing in previous implementations.
              </AlertDescription>
            </Alert>
            
            <p className="mb-4">
              The working demo version shows how the login flow will work with social accounts,
              while the Web3Auth version implements the actual blockchain wallet integration
              using the latest packages specifically compatible with our platform.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="web3auth" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="web3auth">Web3Auth v6.1.4</TabsTrigger>
            <TabsTrigger value="basic">Working Demo</TabsTrigger>
          </TabsList>
          <TabsContent value="web3auth" className="mt-4">
            <Web3AuthLoginV3 />
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