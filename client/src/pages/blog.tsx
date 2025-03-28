import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { blogPosts } from "@/lib/blog-data";

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Mining Insights Blog</h1>
      <p className="text-muted-foreground mb-8">Explore the latest insights, strategies, and updates about CPXTB mining and gaming.</p>
      <div className="grid gap-8">
        {blogPosts.map((post) => (
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
        ))}
      </div>
    </div>
  );
}