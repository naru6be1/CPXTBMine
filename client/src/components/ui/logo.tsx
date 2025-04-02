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
      <img 
        src="/assets/optimized/logo.webp"
        alt="CPXTB Mining Logo"
        loading="lazy"
        width={size === "lg" ? 64 : size === "md" ? 48 : 32}
        height={size === "lg" ? 64 : size === "md" ? 48 : 32}
        className={cn(
          "rounded-full",
          sizes[size]
        )}
      />
      <span className="font-semibold text-xl text-foreground">CPXTBMining</span>
    </div>
  );
}