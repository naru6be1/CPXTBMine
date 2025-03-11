import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  // This is a placeholder that will be replaced with the actual logo
  return (
    <div className={cn(
      "flex items-center gap-2",
      className
    )}>
      <div className={cn(
        "rounded bg-primary/10 flex items-center justify-center",
        sizes[size]
      )}>
        <span className="font-bold text-primary">C</span>
      </div>
      <span className="font-semibold text-foreground">CPXTBMining</span>
    </div>
  );
}
