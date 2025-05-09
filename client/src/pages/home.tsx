import { ConnectWallet } from "@/components/connect-wallet";
import { useWallet } from "@/hooks/use-wallet";
import { Logo } from "@/components/ui/logo";
import { Link } from "wouter";
import { 
  CreditCard, 
  ShoppingCart, 
  Store, 
  Wallet, 
  ChevronRight, 
  BarChart, 
  Clock,
  Shield,
  CheckCircle,
  Globe,
  Lock,
  LineChart,
  Users,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  HeroImage, 
  FeatureImageGallery, 
  TrustIndicators, 
  SecurityFeatures,
  StepByStepGuide
} from "@/components/ImageGallery";

export default function Home() {
  const { isConnected, address } = useWallet();

  return (
    <div className="min-h-screen flex flex-col items-center justify-start">
      {/* Hero Section with Sharp Design */}
      <div className="w-full bg-gradient-to-r from-primary/10 via-background to-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-6">
              <div className="mb-6">
                <Logo size="lg" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Business Payments,
                <span className="text-primary block mt-2">Simplified.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-700 max-w-xl leading-relaxed">
                A professional payment solution that lets your business accept cryptocurrency 
                payments without technical complexity or specialized knowledge.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth">
                  <Button size="lg" className="font-medium px-8 shadow-md hover:shadow-lg transition-all">
                    Get Started <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/easy-payment?to=0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27&amount=10&amountUSD=5&ref=demo-payment">
                  <Button variant="outline" size="lg" className="font-medium border-slate-300">
                    View Payment Demo
                  </Button>
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-8 text-muted-foreground text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span>Trusted by 500+ merchants</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span>Fast setup in minutes</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span>No technical knowledge needed</span>
                </div>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              {/* Enhanced with DevicesMockup illustration */}
              <HeroImage />
            </div>
          </div>
        </div>
      </div>
      
      {/* Business Benefits Section with Visual Gallery */}
      <div className="w-full bg-background py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">Enterprise-Grade Payment Solutions</h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              A complete crypto payment platform built for modern businesses of all sizes
            </p>
          </div>
          
          {/* Enhanced with copyright-free custom illustrations */}
          <FeatureImageGallery className="mb-16" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Simplified Payments</h3>
              <p className="text-muted-foreground">Accept crypto payments through familiar QR codes without requiring customers to have crypto expertise.</p>
            </div>
            
            <div className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Global Reach</h3>
              <p className="text-muted-foreground">Accept payments from anywhere in the world with minimal fees and instant settlements.</p>
            </div>
            
            <div className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Enhanced Security</h3>
              <p className="text-muted-foreground">Blockchain-backed security protects transactions and reduces fraud risks.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section with Professional Steps and Visuals */}
      <div className="w-full bg-accent py-20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">Streamlined Integration Process</h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Get up and running in minutes with our simple four-step process
            </p>
          </div>
          
          {/* Enhanced with visual step-by-step guide */}
          <StepByStepGuide />
          
          {/* Security Features with illustration */}
          <div className="mt-24">
            <SecurityFeatures />
          </div>
        </div>
      </div>
      
      {/* Features Comparison */}
      <div className="w-full bg-background py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">Complete Payment Solution</h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Everything your business needs to succeed with cryptocurrency payments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
              <div className="mb-4 text-primary">
                <LineChart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Analytics</h3>
              <p className="text-muted-foreground text-sm">Monitor transaction performance with detailed reporting dashboards.</p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
              <div className="mb-4 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Customer Management</h3>
              <p className="text-muted-foreground text-sm">Track customer payment history and preferences for better service.</p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
              <div className="mb-4 text-primary">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Multiple Payment Options</h3>
              <p className="text-muted-foreground text-sm">Support for CPXTB tokens and traditional payment methods like PayPal.</p>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
              <div className="mb-4 text-primary">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Branded Experience</h3>
              <p className="text-muted-foreground text-sm">Customize payment pages with your business logo and colors.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section with Professional Design and Trust Badges */}
      <div className="w-full bg-background py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to Transform Your Business Payments?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join forward-thinking businesses already using CPXTB Payment Platform to simplify their cryptocurrency transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="font-medium px-8 shadow-md">
                Create Business Account <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/blog">
              <Button variant="outline" size="lg" className="font-medium border-border">
                Explore Resources
              </Button>
            </Link>
          </div>
          
          {/* Enhanced Trust Indicators with Visual Badge */}
          <div className="mt-12 mb-8">
            <TrustIndicators className="max-w-xl mx-auto" />
          </div>
          
          {/* Stats with Visual Presentation */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-muted-foreground">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="text-primary font-bold text-3xl mb-1">500+</div>
              <div className="text-sm">Active Merchants</div>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="text-primary font-bold text-3xl mb-1">$2M+</div>
              <div className="text-sm">Processed Monthly</div>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="text-primary font-bold text-3xl mb-1">99.9%</div>
              <div className="text-sm">Uptime Reliability</div>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="text-primary font-bold text-3xl mb-1">24/7</div>
              <div className="text-sm">Customer Support</div>
            </div>
          </div>
        </div>
      </div>
      
      {isConnected && address && (
        <div className="w-full max-w-6xl mx-auto px-4 mt-8">
          <div className="bg-card rounded-lg p-6 shadow-md border border-green-500/30">
            <h2 className="text-xl font-semibold text-green-500 dark:text-green-400 mb-2 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Wallet Connected Successfully
            </h2>
            <p className="text-muted-foreground">
              Your wallet ({address.slice(0, 6)}...{address.slice(-4)}) is now connected to the CPXTB Payment Platform
            </p>
          </div>
        </div>
      )}
      
      {/* Professional Footer */}
      <footer className="w-full bg-accent border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo size="md" />
              <p className="text-muted-foreground mt-4 text-sm">
                Professional cryptocurrency payment solutions for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="text-muted-foreground hover:text-primary">Features</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-primary">Pricing</Link></li>
                <li><Link href="/integrations" className="text-muted-foreground hover:text-primary">Integrations</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-primary">Resources</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about-us" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-primary">Careers</Link></li>
                <li><Link href="/press" className="text-muted-foreground hover:text-primary">Press</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link href="/security" className="text-muted-foreground hover:text-primary">Security</Link></li>
                <li><Link href="/compliance" className="text-muted-foreground hover:text-primary">Compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">
              © 2025 CPXTB Payment Platform. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-primary">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}