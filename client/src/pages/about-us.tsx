import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function AboutUsPage() {
  return (
    <div className="container mx-auto max-w-7xl p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="col-span-1 hidden md:block">
        {/* Sidebar space */}
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
            <CardTitle className="text-3xl">About CPXTB Platform</CardTitle>
            <CardDescription>
              Learn more about our mission, vision, and the team behind the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p>
                CPXTB Platform was founded with a clear mission: to make cryptocurrency mining and 
                rewards accessible to everyone, regardless of technical expertise or hardware capabilities. 
                We believe in the democratization of blockchain technology and aim to provide a user-friendly 
                gateway to the world of digital assets.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Our Story</h2>
              <p>
                Established in 2023, CPXTB Platform emerged from the vision of a team of blockchain 
                enthusiasts and developers who recognized the need for a more accessible and 
                rewarding cryptocurrency experience. We saw that traditional mining had become 
                inaccessible to average users due to hardware requirements and technical barriers.
              </p>
              <p>
                By creating an innovative mining ecosystem, we've developed a unique 
                platform where users can earn real cryptocurrency through subscription-based 
                mining plans, without needing specialized equipment or technical expertise.
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">The CPXTB Token</h2>
              <p>
                The CPXTB token is the native reward token of our platform, designed to provide utility 
                across our ecosystem. Based on the Base network, CPXTB (Crypto Points Extended Base) 
                represents a bridge between mining achievements and blockchain rewards.
              </p>
              <p>
                Contract Address: 0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b
              </p>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Our Team</h2>
              <p>
                Our diverse team brings together expertise from blockchain development, mining technology, 
                financial technology, and user experience design. Led by a group of seasoned 
                entrepreneurs with backgrounds in crypto ventures, our team is committed to 
                innovation and excellence in every aspect of the platform.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Blockchain Development Team:</strong> Specialists in smart contract development and blockchain integration</li>
                <li><strong>Mining Solutions Team:</strong> Technical experts focused on optimizing mining rewards and platform performance</li>
                <li><strong>Marketing & Community:</strong> Dedicated to growing our vibrant community and fostering engagement</li>
                <li><strong>Support Team:</strong> Available to assist users with any questions or issues</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Our Values</h2>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Accessibility:</strong> Making cryptocurrency rewards available to everyone</li>
                <li><strong>Transparency:</strong> Open and honest communication about our platform and rewards</li>
                <li><strong>Innovation:</strong> Constantly improving our platform with new features and mining solutions</li>
                <li><strong>Community:</strong> Building a supportive environment for all crypto enthusiasts</li>
                <li><strong>Security:</strong> Prioritizing the protection of user assets and information</li>
              </ul>
            </section>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Contact Us</h2>
              <p>
                Have questions or suggestions? We'd love to hear from you!
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
                  href="https://t.me/CPXTBOfficialSupport" 
                  className="flex items-center hover:text-primary transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <span className="mr-2">💬</span>Telegram Support: @CPXTBOfficialSupport
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
                <br />
                <a 
                  href="https://discord.gg/cpxtbofficial" 
                  className="flex items-center hover:text-primary transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <span className="mr-2">🎮</span>Discord: discord.gg/cpxtbofficial
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
        

      </div>
    </div>
  );
}