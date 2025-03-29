import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarAd, ContentBottomAd } from '@/components/ad-placement';

export default function PrivacyPolicyPage() {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <CardDescription>
              Last updated: March 28, 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4">
              <p>
                At CPXTB Platform, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our website and services.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Information We Collect</h2>
              <h3 className="text-xl font-semibold">Personal Information</h3>
              <p>We may collect the following types of personal information:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Wallet addresses used to interact with our platform</li>
                <li>IP addresses for security and fraud prevention</li>
                <li>Email addresses (if provided for notifications or support)</li>
                <li>Referral information when using our referral program</li>
              </ul>
              
              <h3 className="text-xl font-semibold">Automatically Collected Information</h3>
              <p>When you use our platform, we automatically collect certain information, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (pages visited, time spent on the platform)</li>
                <li>Performance data and error reports</li>
                <li>Game scores and CPXTB earning activities</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>To provide and maintain our services</li>
                <li>To process transactions and distribute CPXTB rewards</li>
                <li>To prevent fraud and enforce our terms of service</li>
                <li>To improve our platform and user experience</li>
                <li>To communicate with you about updates and promotions</li>
                <li>To enforce IP-based restrictions for free CPXTB claims</li>
                <li>To track game performance and distribute rewards accurately</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Cookies and Similar Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience on our platform. 
                These technologies help us remember your preferences, understand how you use our site, and 
                provide personalized content and advertisements.
              </p>
              <p>
                You can control cookie settings through your browser preferences. However, disabling certain 
                cookies may limit your ability to use some features of our platform.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Third-Party Services</h2>
              <p>
                Our platform integrates with third-party services, including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Blockchain networks for processing transactions</li>
                <li>Wallet connection providers (WalletConnect, MetaMask)</li>
                <li>Analytics providers to improve our services</li>
                <li>Advertising partners (Google AdSense)</li>
              </ul>
              <p>
                These third parties may collect information about you when you interact with their services. 
                We encourage you to review their privacy policies for more information.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information from unauthorized 
                access, alteration, disclosure, or destruction. However, no method of transmission over the internet 
                or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Your Rights</h2>
              <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>The right to access your personal information</li>
                <li>The right to correct inaccurate information</li>
                <li>The right to delete your personal information</li>
                <li>The right to object to processing of your information</li>
                <li>The right to data portability</li>
              </ul>
              <p>
                To exercise these rights, please contact us using the information provided at the end of this policy.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                We will notify you of any material changes by posting the new policy on our platform and updating the "Last updated" date.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="space-y-2">
                <a 
                  href="mailto:info@coinpredictiontool.com" 
                  className="flex items-center hover:text-primary transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <span className="mr-2">📧</span>Email: info@coinpredictiontool.com
                </a>
                <br />
                <a 
                  href="https://t.me/CPXTBase" 
                  className="flex items-center hover:text-primary transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <span className="mr-2">💬</span>Telegram Support: @CPXTBase
                </a>
                <br />
                <a 
                  href="https://twitter.com/cpxtbofficial" 
                  className="flex items-center hover:text-primary transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <span className="mr-2">🐦</span>Twitter: @cpxtbofficial
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
        
        <ContentBottomAd />
      </div>
    </div>
  );
}