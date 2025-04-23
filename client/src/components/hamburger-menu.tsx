import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Gift, Pickaxe, Users, Award, Shield, BookOpen, MessageCircle, Info, FileText, AlertTriangle, Store } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuItemClick = () => {
    setIsOpen(false);
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
          <SheetTitle>CPXTB Mining</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-8 pb-8">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              Home
            </Button>
          </Link>
          <Link href="/mining">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <Pickaxe className="mr-2 h-4 w-4" />
              Mining Plans
            </Button>
          </Link>
          <Link href="/referrals">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <Users className="mr-2 h-4 w-4" />
              Referrals
            </Button>
          </Link>
          <Link href="/rewards">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <Gift className="mr-2 h-4 w-4" />
              Rewards
            </Button>
          </Link>
          <Link href="/features">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <Award className="mr-2 h-4 w-4" />
              Features
            </Button>
          </Link>
          <Link href="/blog">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <BookOpen className="mr-2 h-4 w-4" />
              Blog
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <Shield className="mr-2 h-4 w-4" />
              About CPXTB
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
          </Link>
          <Link href="/merchant">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              <Store className="mr-2 h-4 w-4" />
              Merchant Dashboard
            </Button>
          </Link>
          
          {/* Games section removed */}
          
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}