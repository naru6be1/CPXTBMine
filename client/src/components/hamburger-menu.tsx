import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "wouter";

export function HamburgerMenu() {
  return (
    <Sheet>
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
            <Button variant="ghost" className="w-full justify-start">
              Home
            </Button>
          </Link>
          <Link href="/mining">
            <Button variant="ghost" className="w-full justify-start">
              Mining Plans
            </Button>
          </Link>
          <Link href="/referrals">
            <Button variant="ghost" className="w-full justify-start">
              Referrals
            </Button>
          </Link>
          <Link href="/rewards">
            <Button variant="ghost" className="w-full justify-start">
              Rewards
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
