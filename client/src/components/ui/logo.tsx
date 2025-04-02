import { cn } from "@/lib/utils"
import { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  useSvg?: boolean;
}

export function Logo({ className, size = "md", useSvg = true }: LogoProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
      {useSvg ? (
        // SVG version is much more optimized and loads faster
        <img 
          src="/assets/logo.svg"
          alt="CPXTB Mining Logo"
          width={size === "sm" ? 32 : size === "md" ? 48 : 64}
          height={size === "sm" ? 32 : size === "md" ? 48 : 64}
          className={cn(
            "rounded-full",
            sizes[size],
            !isLoaded && "opacity-0",
            "transition-opacity duration-300"
          )}
          loading="eager"
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        // Fallback to PNG if needed
        <img 
          src="/assets/logo.png"
          alt="CPXTB Mining Logo"
          width={size === "sm" ? 32 : size === "md" ? 48 : 64}
          height={size === "sm" ? 32 : size === "md" ? 48 : 64}
          className={cn(
            "rounded-full",
            sizes[size],
            !isLoaded && "opacity-0",
            "transition-opacity duration-300"
          )}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
        />
      )}
      <span className="font-semibold text-xl text-foreground">CPXTBMining</span>
    </div>
  );
}