import * as React from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="rounded-full relative"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] ${theme === 'dark' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'} transition-all absolute`} />
      <Moon className={`h-[1.2rem] w-[1.2rem] ${theme === 'light' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'} transition-all absolute`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function MobileThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        size="sm"
        className="px-2.5"
        onClick={() => setTheme("light")}
      >
        <Sun className="h-4 w-4 mr-1" />
        <span>Light</span>
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        size="sm"
        className="px-2.5"
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-4 w-4 mr-1" />
        <span>Dark</span>
      </Button>
    </div>
  );
}