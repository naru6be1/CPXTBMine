import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { blogPosts } from "@/lib/blog-data";
import { HomePageTopAd, ContentBottomAd, SidebarAd } from "@/components/ad-placement";

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Mining Insights Blog</h1>
      <p className="text-muted-foreground mb-6">Explore the latest insights, strategies, and updates about CPXTB mining and gaming.</p>
      
      {/* Top Ad Banner */}
      <HomePageTopAd />
      
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="grid gap-8">
            {blogPosts.map((post, index) => (
              <>
                <Link key={post.id} href={`/blog/${post.slug}`}>
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
              </>
            ))}
          </div>
          
          {/* Bottom Content Ad */}
          <div className="mt-10">
            <ContentBottomAd />
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
                <li className="text-primary hover:underline cursor-pointer">Mining Strategies</li>
                <li className="text-primary hover:underline cursor-pointer">CPXTB Token Analysis</li>
                <li className="text-primary hover:underline cursor-pointer">Gaming Rewards</li>
                <li className="text-primary hover:underline cursor-pointer">Blockchain Insights</li>
                <li className="text-primary hover:underline cursor-pointer">Crypto Market Updates</li>
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
                Get the latest CPXTB mining insights delivered to your inbox.
              </p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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