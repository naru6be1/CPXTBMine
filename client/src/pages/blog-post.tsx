import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, Tag, Share2, Info, BookOpen, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";
import { blogPosts, getRelatedPosts } from "@/lib/blog-data";
import { useEffect } from "react";
import DefaultBlogImage from "@/components/DefaultBlogImage";

import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BlogPost() {
  const [, params] = useRoute<{ slug: string }>("/blog/:slug");
  const post = blogPosts.find((p) => p.slug === params?.slug);

  // SEO Optimizations
  useEffect(() => {
    if (post) {
      // Set page title with targeted keywords
      document.title = `${post.title} | CPXTB Educational Resources`;
      
      // Set meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", post.summary);
      } else {
        const newMetaDescription = document.createElement('meta');
        newMetaDescription.name = "description";
        newMetaDescription.content = post.summary;
        document.head.appendChild(newMetaDescription);
      }
      
      // Add keywords meta tag
      const keywordsContent = post.keywords ? post.keywords.join(", ") + ", CPXTB, Base network" : 
        "crypto mining without hardware, earn crypto playing games, Base network mining";
      
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute("content", keywordsContent);
      } else {
        const newMetaKeywords = document.createElement('meta');
        newMetaKeywords.name = "keywords";
        newMetaKeywords.content = keywordsContent;
        document.head.appendChild(newMetaKeywords);
      }
      
      // Add Open Graph tags for social sharing
      const ogTags = [
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.summary },
        { property: "og:type", content: "article" },
        { property: "og:url", content: window.location.href },
        { property: "og:image", content: post.image }
      ];
      
      ogTags.forEach(tag => {
        const ogTag = document.querySelector(`meta[property="${tag.property}"]`);
        if (ogTag) {
          ogTag.setAttribute("content", tag.content);
        } else {
          const newOgTag = document.createElement('meta');
          newOgTag.setAttribute("property", tag.property);
          newOgTag.setAttribute("content", tag.content);
          document.head.appendChild(newOgTag);
        }
      });
    }
  }, [post]);

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Post Not Found</h1>
        <Link href="/blog">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  // Current date for the post
  const postDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Get related posts based on shared keywords
  const relatedPosts = getRelatedPosts(post.id, 3);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-4 flex justify-between items-center">
        <Link href="/blog">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Educational Resources
          </Button>
        </Link>
        
        {/* Schema breadcrumbs for SEO */}
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex">
            <li><Link href="/">Home</Link></li>
            <li className="mx-2">/</li>
            <li><Link href="/blog">Educational Resources</Link></li>
            <li className="mx-2">/</li>
            <li aria-current="page">{post.title.substring(0, 20)}...</li>
          </ol>
        </nav>
      </div>
      
      {/* Educational disclaimer alert */}
      <Alert className="mb-6 bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-500 mr-2" />
        <AlertDescription className="text-blue-700">
          This article is provided for educational and informational purposes only. The content does not constitute 
          financial advice, investment advice, trading advice, or any other type of advice. Readers should conduct 
          their own research and consult with qualified professionals before making any investment decisions.
        </AlertDescription>
      </Alert>
      
      {/* Banner space */}
      
      <Card className="border-none shadow-lg mt-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 py-8 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Display keywords as tags for SEO */}
            {post.keywords && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Tag className="h-4 w-4 text-primary" />
                {post.keywords.map((keyword, index) => (
                  <Link key={index} href={`/blog?keyword=${encodeURIComponent(keyword)}`}>
                    <span className="text-xs bg-white text-primary font-medium px-3 py-1 rounded-full cursor-pointer hover:bg-primary/10 transition-colors shadow-sm">
                      {keyword}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="flex items-center text-sm text-slate-700 mb-3 font-medium">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              <span>Published: {postDate} • Educational Resource</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">{post.title}</h1>
          </div>
        </div>
        
        <div className="px-6 py-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex justify-center">
              <div className="bg-white p-2 rounded-lg shadow-md border border-slate-100 flex justify-center w-full max-w-2xl">
                {post.slug.includes('payment') || post.slug.includes('simplifying') ? (
                  <DefaultBlogImage 
                    title={post.title} 
                    type="payment"
                    className="h-auto max-h-[300px] w-full" 
                  />
                ) : post.slug.includes('security') || post.slug.includes('secure') ? (
                  <DefaultBlogImage 
                    title={post.title} 
                    type="security"
                    className="h-auto max-h-[300px] w-full" 
                  />
                ) : post.slug.includes('business') || post.slug.includes('benefits') ? (
                  <DefaultBlogImage 
                    title={post.title} 
                    type="business"
                    className="h-auto max-h-[300px] w-full" 
                  />
                ) : post.slug.includes('experience') || post.slug.includes('customer') ? (
                  <DefaultBlogImage 
                    title={post.title} 
                    type="experience"
                    className="h-auto max-h-[300px] w-full" 
                  />
                ) : (
                  <DefaultBlogImage 
                    title={post.title} 
                    type="technology"
                    className="h-auto max-h-[300px] w-full" 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        
        <CardContent>
          {/* Article content with proper heading structure for SEO */}
          <article className="max-w-none">
            {(() => {
              const paragraphs = post.content.split('\n').map(p => p.trim()).filter(p => p);
              const elements = [];
              
              let inList = false;
              let listItems = [];
              
              for (let i = 0; i < paragraphs.length; i++) {
                const paragraph = paragraphs[i];
                
                // Handle markdown headings
                if (paragraph.startsWith('## ')) {
                  // If we were in a list, close it before adding the heading
                  if (inList) {
                    elements.push(<ul key={`list-${i}`} className="ml-6 mb-6 list-disc">{listItems}</ul>);
                    inList = false;
                    listItems = [];
                  }
                  
                  const headingText = paragraph.replace('## ', '');
                  elements.push(
                    <h2 key={`heading-${i}`} className="text-2xl font-bold mt-8 mb-4 text-slate-900">
                      {headingText}
                    </h2>
                  );
                }
                // Handle markdown lists
                else if (paragraph.startsWith('- ')) {
                  const listItemText = paragraph.replace('- ', '');
                  
                  if (!inList) {
                    inList = true;
                  }
                  
                  listItems.push(
                    <li key={`li-${i}`} className="mb-3 text-slate-900 leading-relaxed">
                      {listItemText}
                    </li>
                  );
                  
                  // If next item is not a list or this is the last item, close the list
                  if (i === paragraphs.length - 1 || !paragraphs[i+1].startsWith('- ')) {
                    elements.push(<ul key={`list-${i}`} className="ml-6 mb-6 list-disc">{listItems}</ul>);
                    inList = false;
                    listItems = [];
                  }
                }
                // Handle bold text
                else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  // If we were in a list, close it before adding the bold text
                  if (inList) {
                    elements.push(<ul key={`list-${i}`} className="ml-6 mb-6 list-disc">{listItems}</ul>);
                    inList = false;
                    listItems = [];
                  }
                  
                  const boldText = paragraph.replace(/^\*\*|\*\*$/g, '');
                  elements.push(
                    <p key={`bold-${i}`} className="font-bold mb-6 text-slate-900 text-lg">
                      {boldText}
                    </p>
                  );
                }
                // Default paragraph handling
                else {
                  // If we were in a list, close it before adding the paragraph
                  if (inList) {
                    elements.push(<ul key={`list-${i}`} className="ml-6 mb-6 list-disc">{listItems}</ul>);
                    inList = false;
                    listItems = [];
                  }
                  
                  elements.push(
                    <p key={`p-${i}`} className="mb-6 text-slate-900 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                }
              }
              
              return elements;
            })()}
          </article>
          
          {/* Educational footnote */}
          <div className="mt-8 p-5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start">
              <BookOpen className="h-5 w-5 text-slate-700 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">Educational Purpose</h3>
                <p className="text-sm text-slate-700">
                  This article aims to provide educational information about blockchain technology and cryptocurrency concepts. 
                  The cryptocurrency market is highly volatile and speculative. Users should be aware that all cryptocurrency 
                  activities involve risk, and should approach them with appropriate caution and only after doing thorough research.
                </p>
              </div>
            </div>
          </div>
          
          {/* Social sharing section */}
          <div className="mt-8 p-4 bg-muted/10 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Share this educational resource</h3>
              <div className="flex space-x-3">
                <button className="p-2 rounded-full bg-primary/10 hover:bg-primary/20" 
                  aria-label="Share on Twitter"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}>
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Related posts for internal linking */}
          {relatedPosts.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Related Educational Resources</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedPosts.map(relatedPost => (
                  <a key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <Card className="h-full cursor-pointer hover:bg-accent/5 transition-all">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">{relatedPost.title}</h4>
                        <p className="text-sm text-muted-foreground">{relatedPost.summary.substring(0, 100)}...</p>
                        <div className="mt-2 text-sm text-primary">Read article →</div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Risk disclaimer */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <ShieldCheck className="h-5 w-5 text-amber-700 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-amber-800 mb-2">Important Notice</h3>
                <p className="text-sm text-amber-700">
                  Cryptocurrency markets are highly volatile and involve substantial risk. Past performance is not 
                  indicative of future results. Before engaging with any cryptocurrency platform or making investment 
                  decisions, readers should conduct thorough research and consider seeking advice from qualified financial professionals. 
                  This content is educational in nature and should not be considered a recommendation to buy, sell, or hold any assets.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-border flex justify-between items-center">
            <Link href="/blog">
              <Button variant="outline" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Educational Resources
              </Button>
            </Link>
            
            <div className="text-sm text-muted-foreground">
              CPXTB Educational Platform
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}