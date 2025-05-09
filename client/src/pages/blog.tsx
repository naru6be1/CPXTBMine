import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { blogPosts } from "@/lib/blog-data";

import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, BookOpen, ShieldCheck } from "lucide-react";
import DefaultBlogImage from "@/components/DefaultBlogImage";

export default function BlogPage() {
  // Add meta tags for SEO optimization
  useEffect(() => {
    // Set the page title
    document.title = "CPXTB Payment Platform Blog: Cryptocurrency Payment Solutions for Businesses";
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Explore resources about cryptocurrency payment processing, merchant solutions, and how to implement crypto payments for your business with the CPXTB platform.");
    } else {
      const newMetaDescription = document.createElement('meta');
      newMetaDescription.name = "description";
      newMetaDescription.content = "Explore resources about cryptocurrency payment processing, merchant solutions, and how to implement crypto payments for your business with the CPXTB platform.";
      document.head.appendChild(newMetaDescription);
    }
    
    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", "crypto payment processing, accept cryptocurrency payments, business crypto adoption, merchant payment solutions, CPXTB payment platform, Base network payments");
    } else {
      const newMetaKeywords = document.createElement('meta');
      newMetaKeywords.name = "keywords";
      newMetaKeywords.content = "crypto payment processing, accept cryptocurrency payments, business crypto adoption, merchant payment solutions, CPXTB payment platform, Base network payments";
      document.head.appendChild(newMetaKeywords);
    }
  }, []);

  // Group key topics for SEO emphasis
  const seoKeyTopics = [
    { name: "Accept Cryptocurrency Payments", slug: "simplifying-crypto-payments-for-business" },
    { name: "Crypto Payment Benefits", slug: "cryptocurrency-payment-benefits-business" },
    { name: "Customer Payment Experience", slug: "seamless-crypto-payment-experience" },
    { name: "Payment Processing Solutions", slug: "simplifying-crypto-payments-for-business" },
    { name: "Blockchain Payments", slug: "blockchain-payments-business-guide" },
    { name: "Payment Security", slug: "crypto-payment-security-best-practices" }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Merchant Resources: Cryptocurrency Payment Solutions</h1>
      <p className="text-muted-foreground mb-4">
        Educational content about accepting cryptocurrency payments for your business, with a focus on streamlined integration, enhanced security, and expanding your customer base through the CPXTB payment platform.
      </p>
      
      {/* Educational disclaimer */}
      <Alert className="mb-6 bg-blue-50 border border-blue-200">
        <InfoIcon className="h-5 w-5 text-blue-500 mr-2" />
        <AlertDescription className="text-blue-700">
          This blog provides educational content about cryptocurrency payment processing and blockchain technology. All information presented is for learning purposes only and should not be considered financial or business advice. Always conduct thorough research and consult qualified professionals before implementing new payment solutions.
        </AlertDescription>
      </Alert>
      
      {/* Banner space */}
      
      {/* SEO-optimized topic section */}
      <div className="my-6 p-4 bg-muted/10 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Payment Processing Topics</h2>
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
          <div className="mb-8 p-6 bg-slate-100 rounded-lg border border-slate-200">
            <div className="flex items-start mb-4">
              <BookOpen className="h-6 w-6 text-primary mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-2 text-slate-800">Cryptocurrency Payment Education</h2>
                <p className="text-slate-700">
                  Our merchant resources aim to help businesses understand the benefits and implementation 
                  strategies for cryptocurrency payment acceptance. We believe that informed merchants 
                  make better decisions about their payment infrastructure in this rapidly evolving digital economy.
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
                      <div className="w-full md:w-1/3 bg-slate-50 flex items-center justify-center p-4">
                        {post.slug.includes('payment') || post.slug.includes('simplifying') ? (
                          <DefaultBlogImage 
                            title={post.title} 
                            type="payment"
                            className="h-auto max-h-[200px] w-full" 
                          />
                        ) : post.slug.includes('security') || post.slug.includes('secure') ? (
                          <DefaultBlogImage 
                            title={post.title} 
                            type="security"
                            className="h-auto max-h-[200px] w-full" 
                          />
                        ) : post.slug.includes('business') || post.slug.includes('benefits') ? (
                          <DefaultBlogImage 
                            title={post.title} 
                            type="business"
                            className="h-auto max-h-[200px] w-full" 
                          />
                        ) : post.slug.includes('experience') || post.slug.includes('customer') ? (
                          <DefaultBlogImage 
                            title={post.title} 
                            type="experience"
                            className="h-auto max-h-[200px] w-full" 
                          />
                        ) : (
                          <DefaultBlogImage 
                            title={post.title} 
                            type="technology"
                            className="h-auto max-h-[200px] w-full" 
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
                                <span key={kidx} className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
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
              </div>
            ))}
          </div>
          
          {/* Educational disclaimer and resources section */}
          <div className="mt-10 p-6 bg-slate-100 rounded-lg border border-slate-200">
            <div className="flex items-start mb-4">
              <ShieldCheck className="h-6 w-6 text-green-600 mr-3 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-3 text-slate-800">Merchant Resources for Payment Processing</h2>
                <p className="mb-4 text-slate-700">
                  Our merchant content aims to provide clear, practical information about cryptocurrency payment processing 
                  and blockchain integration for businesses. We strive to explain complex technologies in accessible language 
                  while maintaining practical implementation guidance.
                </p>
                <p className="mb-4 text-slate-700">
                  For businesses interested in expanding their payment options without requiring extensive technical expertise, 
                  our articles cover a range of topics from fundamental payment concepts to specific implementation strategies 
                  on the Base network.
                </p>
                <p className="text-slate-700">
                  We encourage businesses to approach cryptocurrency payment implementation with appropriate planning and security 
                  considerations. Our educational goal is to help merchants understand both the benefits and responsibilities 
                  associated with accepting digital currencies.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:w-1/4 space-y-8">
          <Card className="p-4 bg-slate-50 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Payment Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/simplifying-crypto-payments-for-business">Crypto Payment Integration</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/cryptocurrency-payment-benefits-business">Payment Benefits for Business</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/blockchain-payments-business-guide">Blockchain Payment Guide</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/seamless-crypto-payment-experience">Customer Payment Experience</Link>
                </li>
                <li className="text-primary hover:underline cursor-pointer">
                  <Link href="/blog/crypto-payment-security-best-practices">Payment Security Practices</Link>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Risk Disclaimer */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-800">Business Implementation Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700 mb-4">
                The content provided in this blog is for informational and educational purposes only. It does not constitute 
                legal, financial, or technical advice. Cryptocurrency payment implementation involves considerations regarding 
                security, compliance, and technical integration.
              </p>
              <p className="text-sm text-amber-700">
                Always conduct appropriate due diligence and consider consulting with qualified professionals before 
                implementing new payment solutions for your business.
              </p>
            </CardContent>
          </Card>
          
          <Card className="p-4 bg-slate-50 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Merchant Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 mb-4">
                Receive merchant-focused content and updates on our payment platform features.
              </p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Business email" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  aria-label="Email for subscription"
                />
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 rounded-md text-sm">
                  Subscribe
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}