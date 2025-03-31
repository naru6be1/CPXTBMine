import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MiningPage from "@/pages/mining";
import ReferralsPage from "@/pages/referrals";
import RewardsPage from "@/pages/rewards";
import FeaturesPage from "@/pages/features";
import BlogPage from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import SpaceMiningGame from "@/pages/games/space-mining";
import MemoryMatchGame from "@/pages/games/memory-match";
import AboutUsPage from "@/pages/about-us";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import { config } from "./lib/web3";
import { WagmiConfig } from 'wagmi'
import { ErrorBoundary } from "@/components/error-boundary";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { LiveUserCount } from "@/components/live-user-count";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mining" component={MiningPage} />
      <Route path="/referrals" component={ReferralsPage} />
      <Route path="/rewards" component={RewardsPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/about" component={AboutPage} />
      <Route path="/about-us" component={AboutUsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/games/space-mining" component={SpaceMiningGame} />
      <Route path="/games/memory-match" component={MemoryMatchGame} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
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
          <div className="fixed top-4 right-4 z-50">
            <LiveUserCount />
          </div>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  );
}

export default App;