import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarAd, ContentBottomAd } from '@/components/ad-placement';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-7xl p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="col-span-1 hidden md:block">
        <SidebarAd />
      </div>
      
      <div className="col-span-1 md:col-span-3 space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <CardDescription>
              Last updated: March 28, 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4">
              <p>
                Welcome to CPXTB Platform. These Terms of Service ("Terms") govern your use of our website, 
                applications, games, and services (collectively, the "Platform"). By accessing or using our 
                Platform, you agree to be bound by these Terms. If you do not agree, please do not use our Platform.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the CPXTB Platform, you acknowledge that you have read, understood, and agree 
                to be bound by these Terms and our Privacy Policy. If you are using the Platform on behalf of an 
                organization, you represent that you have the authority to bind that organization, and these Terms apply to that organization.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Eligibility</h2>
              <p>
                You must be at least 18 years old to use our Platform. By using the Platform, you represent and 
                warrant that you meet all eligibility requirements. The Platform is not available to users who have been 
                suspended or removed from the Platform for any reason.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Account Registration and Security</h2>
              <p>
                To access certain features of the Platform, you need to connect a cryptocurrency wallet. You are 
                responsible for maintaining the security of your wallet and all activities that occur using your wallet. 
                We are not responsible for any loss or damage arising from your failure to maintain the security of your wallet.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. CPXTB Token and Mining Plans</h2>
              <p>
                CPXTB is the native utility token of our Platform. CPXTB tokens are distributed as rewards for 
                participating in our games, activating mining plans, and using our referral program.
              </p>
              <h3 className="text-xl font-semibold">4.1 Mining Plans</h3>
              <p>
                We offer different mining plans (Bronze, Silver, and Gold) with varying reward rates and durations. 
                When you activate a mining plan, you agree to the specific terms of that plan, including the duration 
                and reward distribution schedule.
              </p>
              <h3 className="text-xl font-semibold">4.2 Rewards Distribution</h3>
              <p>
                CPXTB rewards are distributed according to the specific rates and conditions outlined for each plan or activity. 
                We reserve the right to adjust reward rates at any time, but changes will not affect active plans.
              </p>
              <h3 className="text-xl font-semibold">4.3 IP Restrictions for Free Claims</h3>
              <p>
                Free CPXTB claims are subject to IP-based restrictions to prevent abuse. Multiple claims from the same 
                IP address within the specified time period are not permitted.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Games and Activities</h2>
              <p>
                Our Platform offers various games and activities that allow users to earn CPXTB tokens. When 
                participating in these activities, you agree to follow the specific rules and conditions for each game.
              </p>
              <p>
                Attempting to manipulate games, exploit bugs, or use automated tools to gain an unfair advantage is 
                strictly prohibited and may result in the forfeiture of rewards and termination of access to the Platform.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. Referral Program</h2>
              <p>
                Our referral program allows users to earn additional rewards by referring new users to the Platform. 
                When participating in the referral program, you agree to comply with all applicable laws and regulations 
                regarding marketing and referrals.
              </p>
              <p>
                Self-referrals or creating multiple accounts to generate referral rewards are prohibited and may result 
                in the forfeiture of all rewards and termination of access to the Platform.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Prohibited Activities</h2>
              <p>
                When using our Platform, you agree not to:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the intellectual property rights of others</li>
                <li>Use the Platform to engage in fraudulent activities</li>
                <li>Attempt to gain unauthorized access to any part of the Platform</li>
                <li>Use bots, scripts, or automated tools to interact with the Platform</li>
                <li>Attempt to manipulate or exploit game mechanics</li>
                <li>Create multiple accounts to bypass restrictions</li>
                <li>Engage in activities that could damage or overburden the Platform</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Platform, including but not limited to text, graphics, 
                logos, icons, images, audio clips, and software, are owned by CPXTB Platform or its licensors and are 
                protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                You may not use, reproduce, distribute, modify, or create derivative works of any content from the 
                Platform without our express prior written consent.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">9. Disclaimers and Limitations of Liability</h2>
              <p>
                The Platform and all content are provided on an "as is" and "as available" basis, without warranties 
                of any kind, either express or implied. We disclaim all warranties, including but not limited to implied 
                warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
              <p>
                We are not responsible for any fluctuations in the value of CPXTB tokens or any other digital assets. 
                Cryptocurrency investments involve significant risk, and you should never invest more than you can afford to lose.
              </p>
              <p>
                In no event shall CPXTB Platform be liable for any direct, indirect, incidental, special, consequential, 
                or punitive damages arising out of or related to your use of the Platform.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">10. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless CPXTB Platform and its officers, directors, employees, 
                and agents from and against any claims, liabilities, damages, losses, and expenses, including but not limited 
                to reasonable attorneys' fees, arising out of or in any way connected with your access to or use of the Platform.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">11. Modifications to the Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by 
                posting a notice on our Platform. Your continued use of the Platform after such changes constitutes your 
                acceptance of the new Terms.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
                CPXTB Platform is registered, without regard to its conflict of law provisions.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">13. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p>
                Email: legal@cpxtb-platform.com<br />
                Address: CPXTB Platform, 123 Blockchain Street, Suite 456, Crypto City, CC 78901
              </p>
            </section>
          </CardContent>
        </Card>
        
        <ContentBottomAd />
      </div>
    </div>
  );
}