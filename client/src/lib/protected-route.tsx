import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const { isConnected } = useWallet();

  // Debug logs
  console.log("Protected Route Check:", { path, isLoading, isAuthenticated: !!user, isWalletConnected: isConnected });

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Ensure user is authenticated or has wallet connected
  if (!user) {
    console.log("User not authenticated, redirecting to auth page");
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}