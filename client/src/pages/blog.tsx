import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { blogPosts } from "@/lib/blog-data";
import { HomePageTopAd, ContentBottomAd, SidebarAd } from "@/components/ad-placement";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, BookOpen, ShieldCheck } from "lucide-react";

export default function BlogPage() {
  // Add meta tags for SEO optimization
  useEffect(() => {
    // Set the page title
    document.title = "CPXTB Mining Blog: Crypto Mining Without Hardware on Base Network";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Learn about crypto mining without hardware and Base network mining strategies with CPXTB's innovative platform.");
    } else {
      const newMetaDescription = document.createElement('meta');
      newMetaDescription.name = "description";
      newMetaDescription.content = "Learn about crypto mining without hardware and Base network mining strategies with CPXTB's innovative platform.";
      document.head.appendChild(newMetaDescription);
    }
    
    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", "crypto mining without hardware, Base network mining, hardware-free mining, no hardware mining, CPXTB");
    } else {
      const newMetaKeywords = document.createElement('meta');
      newMetaKeywords.name = "keywords";
      newMetaKeywords.content = "crypto mining without hardware, Base network mining, hardware-free mining, no hardware mining, CPXTB";
      document.head.appendChild(newMetaKeywords);
    }
  }, []);

  // Group key topics for SEO emphasis
  const seoKeyTopics = [
    { name: "Crypto Mining Without Hardware", slug: "crypto-mining-without-hardware" },
    { name: "Base Network Mining", slug: "base-network-mining-strategies" },
    { name: "Hardware-Free Mining Solutions", slug: "crypto-mining-without-hardware" },
    { name: "CPXTB Token Mining", slug: "crypto-mining-without-hardware" },
    { name: "Blockchain Education", slug: "blockchain-technology-beginners-guide" },
    { name: "Responsible Crypto Practices", slug: "responsible-crypto-participation" }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Educational Resources: Crypto Technology & Base Network</h1>
      <p className="text-muted-foreground mb-4">
        Educational content about blockchain technology, with a focus on Base network mining without expensive hardware requirements and maximizing rewards through the CPXTB platform.
      </p>
      
      {/* Educational disclaimer */}
      <Alert className="mb-6 bg-blue-50 border border-blue-200">
        <InfoIcon className="h-5 w-5 text-blue-500 mr-2" />
        <AlertDescription className="text-blue-700">
          This blog provides educational content about cryptocurrency and blockchain technology. All information presented is for learning purposes only and should not be considered financial advice. Always conduct thorough research and consult qualified professionals before making investment decisions.
        </AlertDescription>
      </Alert>
      
      {/* Top Ad Banner */}
      <HomePageTopAd />
      
      {/* SEO-optimized topic section */}
      <div className="my-6 p-4 bg-muted/10 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Educational Topics</h2>
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
          {/* Education intro section */}
          <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start mb-4">
              <BookOpen className="h-6 w-6 text-primary mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Blockchain Technology Education</h2>
                <p className="text-slate-700">
                  Our educational resources aim to help readers understand the fundamentals of blockchain technology, 
                  cryptocurrency systems, and responsible participation in the digital asset ecosystem. 
                  We believe that informed users make better decisions in this rapidly evolving space.
                </p>
              </div>
            </div>
          </div>
          
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
          
          {/* Educational disclaimer and resources section */}
          <div className="mt-10 p-6 bg-muted/5 rounded-lg border border-border">
            <div className="flex items-start mb-4">
              <ShieldCheck className="h-6 w-6 text-green-600 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Educational Resources on Blockchain Technology</h2>
                <p className="mb-4">
                  Our educational content aims to provide clear, accurate information about blockchain technology and cryptocurrency concepts.
                  We strive to explain complex ideas in accessible language while maintaining factual accuracy.
                </p>
                <p className="mb-4">
                  For those interested in learning about cryptocurrency systems without requiring technical expertise, 
                  our articles cover a range of topics from fundamental blockchain concepts to specific applications 
                  on networks like Base.
                </p>
                <p>
                  We encourage readers to explore multiple sources of information and approach all cryptocurrency-related activities 
                  with appropriate caution. Our educational goal is to help readers understand both the potential opportunities and 
                  risks associated with blockchain technology.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar with Ads */}
        <div className="lg:w-1/4 space-y-8">
          <Card className="p-4 bg-muted/10">
            <CardHeader>
              <CardTitle className="text-lg">Educational Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/crypto-mining-without-hardware">Crypto Mining Without Hardware</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/base-network-mining-strategies">Base Network Mining</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/blockchain-technology-beginners-guide">Blockchain Technology Guide</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/responsible-crypto-participation">Responsible Crypto Practices</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/cpxtb-token-on-base-network">CPXTB Token on Base Network</Link>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Risk Disclaimer */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-800">Educational Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700 mb-4">
                The content provided in this blog is for informational and educational purposes only. It does not constitute 
                financial advice, investment advice, or any other type of advice. Cryptocurrency and blockchain technologies 
                involve significant risk and volatility.
              </p>
              <p className="text-sm text-amber-700">
                Always conduct your own research and consider consulting with qualified professionals before 
                making any financial decisions related to cryptocurrency or blockchain technologies.
              </p>
            </CardContent>
          </Card>
          
          {/* Sidebar Ad */}
          <SidebarAd />
          
          <Card className="p-4 bg-muted/10">
            <CardHeader>
              <CardTitle className="text-lg">Stay Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Receive educational content about blockchain technology and updates on our platform.
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