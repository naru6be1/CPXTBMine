import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { blogPosts } from "@/lib/blog-data";
import { HomePageTopAd, ContentBottomAd, SidebarAd } from "@/components/ad-placement";
import { useEffect } from "react";

export default function BlogPage() {
  // Add meta tags for SEO optimization
  useEffect(() => {
    // Set the page title
    document.title = "CPXTB Mining Blog: Crypto Mining Without Hardware & Play-to-Earn";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Learn about crypto mining without hardware, earn crypto playing games, and Base network mining strategies with CPXTB's innovative platform.");
    } else {
      const newMetaDescription = document.createElement('meta');
      newMetaDescription.name = "description";
      newMetaDescription.content = "Learn about crypto mining without hardware, earn crypto playing games, and Base network mining strategies with CPXTB's innovative platform.";
      document.head.appendChild(newMetaDescription);
    }
    
    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", "crypto mining without hardware, earn crypto playing games, Base network mining, play-to-earn crypto, no hardware mining, CPXTB");
    } else {
      const newMetaKeywords = document.createElement('meta');
      newMetaKeywords.name = "keywords";
      newMetaKeywords.content = "crypto mining without hardware, earn crypto playing games, Base network mining, play-to-earn crypto, no hardware mining, CPXTB";
      document.head.appendChild(newMetaKeywords);
    }
  }, []);

  // Group key topics for SEO emphasis
  const seoKeyTopics = [
    { name: "Crypto Mining Without Hardware", slug: "crypto-mining-without-hardware" },
    { name: "Earn Crypto Playing Games", slug: "earn-crypto-playing-games" },
    { name: "Base Network Mining", slug: "base-network-mining-strategies" },
    { name: "Play-to-Earn Cryptocurrency", slug: "earn-crypto-playing-games" },
    { name: "Hardware-Free Mining Solutions", slug: "crypto-mining-without-hardware" }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Crypto Mining Without Hardware: CPXTB Insights</h1>
      <p className="text-muted-foreground mb-6">
        Explore how to earn crypto playing games and participate in Base network mining without expensive hardware requirements.
      </p>
      
      {/* Top Ad Banner */}
      <HomePageTopAd />
      
      {/* SEO-optimized topic section */}
      <div className="my-6 p-4 bg-muted/10 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Popular Mining & Gaming Topics</h2>
        <div className="flex flex-wrap gap-2">
          {seoKeyTopics.map((topic, index) => (
            <Link key={index} href={`/blog/${topic.slug}`}>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium hover:bg-primary/20 cursor-pointer inline-block">
                {topic.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="grid gap-8">
            {blogPosts.map((post, index) => (
              <div key={post.id}>
                <Link href={`/blog/${post.slug}`}>
                  <Card className="cursor-pointer hover:bg-accent/5 transition-all hover:shadow-md overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/3 bg-muted/20 flex items-center justify-center p-4">
                        {post.image && (
                          <img 
                            src={post.image} 
                            alt={post.title} 
                            className="h-auto max-h-[200px] w-full object-contain"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="w-full md:w-2/3">
                        <CardHeader>
                          <CardTitle>{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{post.summary}</p>
                          
                          {/* Display keywords for better SEO */}
                          {post.keywords && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.keywords.map((keyword, kidx) => (
                                <span key={kidx} className="text-xs bg-muted/30 text-muted-foreground px-2 py-0.5 rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-4 text-sm text-primary font-medium">Read more →</div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                </Link>
                
                {/* Insert ad after every 3rd post */}
                {(index + 1) % 3 === 0 && index < blogPosts.length - 1 && (
                  <ContentBottomAd key={`ad-${index}`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Bottom Content Ad */}
          <div className="mt-10">
            <ContentBottomAd />
          </div>
          
          {/* SEO-enhanced conclusion section */}
          <div className="mt-10 p-6 bg-muted/5 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-3">Why Choose CPXTB for Crypto Mining Without Hardware?</h2>
            <p className="mb-4">
              Our platform provides innovative solutions for those looking to earn cryptocurrency without investing in expensive mining hardware. 
              Through our Base network mining platform and play-to-earn games, anyone can start accumulating CPXTB tokens with minimal barriers to entry.
            </p>
            <p>
              Whether you're interested in our structured mining plans or prefer to earn crypto playing games like Space Mining and Memory Match, 
              CPXTB offers accessible options for all types of users on the Base blockchain network.
            </p>
          </div>
        </div>
        
        {/* Sidebar with Ads */}
        <div className="lg:w-1/4 space-y-8">
          <Card className="p-4 bg-muted/10">
            <CardHeader>
              <CardTitle className="text-lg">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/crypto-mining-without-hardware">Crypto Mining Without Hardware</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/earn-crypto-playing-games">Earn Crypto Playing Games</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/base-network-mining-strategies">Base Network Mining</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/future-crypto-gaming-mining">Play-to-Earn Innovations</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/mining">CPXTB Mining Plans</Link>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Sidebar Ad */}
          <SidebarAd />
          
          <Card className="p-4 bg-muted/10">
            <CardHeader>
              <CardTitle className="text-lg">Subscribe to Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get the latest insights on crypto mining without hardware and play-to-earn opportunities.
              </p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-label="Email for subscription"
                />
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 rounded-md text-sm">
                  Join
                </button>
              </div>
            </CardContent>
          </Card>
          
          {/* Second Sidebar Ad */}
          <SidebarAd />
        </div>
      </div>
    </div>
  );
}