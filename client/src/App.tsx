import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { config } from "./lib/web3";
import { WagmiConfig } from 'wagmi'
import { ErrorBoundary } from "@/components/error-boundary";
import { HamburgerMenu } from "@/components/hamburger-menu";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <HamburgerMenu />
          <Router />
          <Toaster />
        </QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  );
}

export default App;