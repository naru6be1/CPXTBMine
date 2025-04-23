import { cn } from "@/lib/utils"

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
      <div 
        className={cn(
          "rounded-full bg-primary/30 flex items-center justify-center",
          sizes[size]
        )}
      >
        <span className="text-primary font-bold">CP</span>
      </div>
      <span className="font-semibold text-xl text-foreground">CPXTBMining</span>
    </div>
  );
}