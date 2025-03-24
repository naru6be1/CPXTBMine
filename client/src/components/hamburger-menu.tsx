import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
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
              Mining Plans
            </Button>
          </Link>
          <Link href="/referrals">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              Referrals
            </Button>
          </Link>
          <Link href="/rewards">
            <Button variant="ghost" className="w-full justify-start" onClick={handleMenuItemClick}>
              Rewards
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}