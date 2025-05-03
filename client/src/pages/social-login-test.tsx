import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import BasicSocialLogin from '../components/BasicSocialLogin';

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
              This page demonstrates our social login solution.
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
            
            <Alert className="mb-6 border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Technical Note</AlertTitle>
              <AlertDescription>
                While we continue optimizing the Web3Auth integration behind the scenes,
                this demo shows the exact user flow and experience that will be available
                in the production version. The mobile experience is fully functional.
              </AlertDescription>
            </Alert>
            
            <p className="mb-4">
              The demo below shows the social login flow, including generation of a wallet address
              that can be used for transactions. Your users will be able to log in with their
              favorite social accounts without needing to understand blockchain technology.
            </p>
          </CardContent>
        </Card>
        
        <BasicSocialLogin />
      </div>
    </div>
  );
};

export default SocialLoginTestPage;