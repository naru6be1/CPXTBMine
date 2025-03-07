import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { wagmiConfig } from "./lib/web3";
import { WagmiProvider } from 'wagmi'
import { Web3Modal } from '@web3modal/wagmi'

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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Web3Modal />
        <Toaster />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;