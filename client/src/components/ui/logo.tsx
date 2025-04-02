import { cn } from "@/lib/utils"
import Image from "@/components/ui/image"

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  return (
    <div className={cn(
      "flex items-center gap-3",
      className
    )}>
      <img 
        src="/assets/logo.png"
        alt="CPXTB Mining Logo"
        className={cn(
          "rounded-full",
          sizes[size]
        )}
      />
      <span className="font-semibold text-xl text-foreground">CPXTBMining</span>
    </div>
  );
}