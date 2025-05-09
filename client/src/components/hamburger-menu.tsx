import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, BookOpen, MessageCircle, Info, FileText, AlertTriangle, Store, LogOut, LogIn, FileSignature, User, CreditCard, ShoppingCart, BarChart, Settings, Moon, Sun, PresentationIcon, Download } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/providers/ThemeProvider";
import { Separator } from "@/components/ui/separator";

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  const handleMenuItemClick = () => {
    setIsOpen(false);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setIsOpen(false);
        setLocation("/");
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>CPXTB Payment Platform</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-8 pb-8">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              Home
            </Button>
          </Link>
          <Link href="/merchant">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <Store className="mr-2 h-4 w-4" />
              Merchant Dashboard
            </Button>
          </Link>
          <Link href="/buy-cpxtb">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <CreditCard className="mr-2 h-4 w-4" />
              Buy CPXTB Tokens
            </Button>
          </Link>
          <Link href="/payments">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Payment History
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <BarChart className="mr-2 h-4 w-4" />
              Reports & Analytics
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Link href="/blog">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <BookOpen className="mr-2 h-4 w-4" />
              Blog
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
          </Link>
          <Link href="/presentation">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <PresentationIcon className="mr-2 h-4 w-4" />
              Platform Presentation
            </Button>
          </Link>
          
          {/* Merchant section */}
          
          <div className="border-t border-border my-2 pt-2">
            <h3 className="px-4 py-2 text-sm font-medium text-muted-foreground">Legal & Information</h3>
            <Link href="/about-us">
              <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
                <Info className="mr-2 h-4 w-4" />
                About Us
              </Button>
            </Link>
            <Link href="/privacy-policy">
              <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
                <FileText className="mr-2 h-4 w-4" />
                Privacy Policy
              </Button>
            </Link>
            <Link href="/terms-of-service">
              <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Terms of Service
              </Button>
            </Link>
            <Link href="/legal-documents">
              <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
                <FileSignature className="mr-2 h-4 w-4" />
                Legal Documents
              </Button>
            </Link>
          </div>
          
          {/* Appearance (Theme) section */}
          <div className="border-t border-border my-2 pt-2">
            <h3 className="px-4 py-2 text-sm font-medium text-muted-foreground">Appearance</h3>
            <div className="grid grid-cols-2 gap-2 px-4 py-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>
          
          {/* User authentication section */}
          <div className="border-t border-border my-2 pt-2">
            <h3 className="px-4 py-2 text-sm font-medium text-muted-foreground">Account</h3>
            {user ? (
              <>
                <div className="px-4 py-2 text-sm">
                  Signed in as <span className="font-semibold">{user.username}</span>
                </div>
                <Link href="/profile">
                  <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in / Register
                </Button>
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}