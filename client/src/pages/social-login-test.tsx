import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Code2 } from 'lucide-react';
import BasicSocialLogin from '../components/BasicSocialLogin';
import Web3AuthIntegration from '../components/Web3AuthIntegration';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Test page for the social login components
 */
const SocialLoginTestPage: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);

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
              <AlertTitle>Ready for Production</AlertTitle>
              <AlertDescription>
                This working demo demonstrates the social login experience that will be implemented
                in the production version. It provides a smooth user experience with wallet address
                generation through social accounts.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center space-x-2 mb-6">
              <Switch 
                id="show-advanced" 
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
              <Label htmlFor="show-advanced" className="text-sm cursor-pointer">
                Show Advanced Options
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
          <Tabs defaultValue="demo" className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="demo">Working Demo</TabsTrigger>
              <TabsTrigger value="advanced">Web3Auth Integration</TabsTrigger>
            </TabsList>
            <TabsContent value="demo" className="mt-4">
              <BasicSocialLogin />
            </TabsContent>
            <TabsContent value="advanced" className="mt-4">
              <Web3AuthIntegration />
            </TabsContent>
          </Tabs>
        ) : (
          <BasicSocialLogin />
        )}
      </div>
    </div>
  );
};

export default SocialLoginTestPage;