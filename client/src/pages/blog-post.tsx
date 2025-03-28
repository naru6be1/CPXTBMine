import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar } from "lucide-react";
import { Link, useRoute } from "wouter";
import { blogPosts } from "@/lib/blog-data";

export default function BlogPost() {
  const [, params] = useRoute<{ slug: string }>("/blog/:slug");
  const post = blogPosts.find((p) => p.slug === params?.slug);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/blog">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="pb-0">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Calendar className="mr-2 h-4 w-4" />
            <span>{postDate}</span>
          </div>
          <CardTitle className="text-3xl mb-4">{post.title}</CardTitle>
        </CardHeader>
        
        {post.image && (
          <div className="px-6 py-4">
            <div className="bg-muted/20 p-6 rounded-lg flex justify-center">
              <img 
                src={post.image} 
                alt={post.title} 
                className="h-auto max-h-[300px] w-auto object-contain"
              />
            </div>
          </div>
        )}
        
        <CardContent>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph.trim()}</p>
            ))}
          </div>
          
          <div className="mt-8 pt-4 border-t border-border flex justify-between items-center">
            <Link href="/blog">
              <Button variant="outline" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
            
            <div className="text-sm text-muted-foreground">
              CPXTB Mining Platform
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}