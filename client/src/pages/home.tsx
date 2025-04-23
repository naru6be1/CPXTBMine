import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <h1 className="text-4xl font-bold text-primary">CPXTB Platform</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The premier platform for cryptocurrency mining and payments
          </p>
        </div>

        {/* Banner space */}
        <div className="p-6 bg-primary/10 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Welcome to CPXTB Platform</h2>
          <p className="mb-4">Earn rewards through our tiered mining plans</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
            <Link href="/mining" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Start Mining
            </Link>
            <Link href="/auth" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
              Login / Register
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer with links */}
      <footer className="w-full max-w-4xl mx-auto mt-16 mb-8 px-4">
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-muted-foreground">
            <Link href="/about-us" className="hover:text-primary transition-colors">
              About Us
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact Us
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            © 2025 CPXTB Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}