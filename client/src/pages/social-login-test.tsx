import React from 'react';
import SimpleSocialLoginV2 from '../components/SimpleSocialLoginV2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Test page for the simplified social login component
 */
const SocialLoginTestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Social Login Test Page</CardTitle>
            <CardDescription>
              This is a test page for the Web3Auth social login component.
              It provides a reliable way to test the login functionality in isolation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This component is a simplified implementation of Web3Auth with minimal configuration.
              It works by directly importing the Buffer polyfill and configuring Web3Auth with streamlined settings.
            </p>
            <p className="mb-4">
              We've updated the component to use a more reliable configuration that should work better across different environments.
            </p>
            <p>
              Try logging in with your social account below to test if it works correctly.
            </p>
          </CardContent>
        </Card>
        
        {/* Using our new improved version */}
        <SimpleSocialLoginV2 />
      </div>
    </div>
  );
};

export default SocialLoginTestPage;