import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Gift, Pickaxe, Users, Award, Shield, BookOpen } from "lucide-react";
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
      <SheetContent side="left" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>CPXTB Mining</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-8">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}