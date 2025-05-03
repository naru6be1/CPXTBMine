import React from 'react';
import SimpleSocialLogin from '../components/SimpleSocialLogin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
              This is a test page for the simplified Web3Auth social login component. 
              It provides a reliable way to test the social login functionality in isolation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This component is a standalone implementation of Web3Auth with minimal dependencies.
              It works by directly importing the Buffer polyfill and configuring Web3Auth with simplified settings.
            </p>
            <p>
              Try logging in with your social account below to test if it works correctly.
            </p>
          </CardContent>
        </Card>
        
        <SimpleSocialLogin />
      </div>
    </div>
  );
};

export default SocialLoginTestPage;