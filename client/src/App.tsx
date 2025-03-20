import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { config } from "./lib/web3";
import { WagmiConfig } from 'wagmi';
import { LanguageToggle } from "@/components/language-toggle";
import "./i18n"; // Import i18n configuration

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
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <LanguageToggle />
        <Toaster />
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App;