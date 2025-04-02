import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Twitter } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Telegram Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Our support team is available 24/7 on Telegram to assist you with any questions or concerns about CPXTB mining.
            </p>
            <a 
              href="https://t.me/CPXTBOfficial" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://t.me/CPXTBOfficial', '_blank', 'noopener,noreferrer');
              }}
            >
              <Button className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support on Telegram
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Twitter className="h-6 w-6" />
              Twitter Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Follow us on Twitter for the latest updates, announcements, and to reach out with your questions.
            </p>
            <a 
              href="https://twitter.com/cpxtbofficial" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://twitter.com/cpxtbofficial', '_blank', 'noopener,noreferrer');
              }}
            >
              <Button className="w-full">
                <Twitter className="mr-2 h-4 w-4" />
                Follow us on Twitter
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Email Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Send us an email with your questions, feedback, or concerns and our team will get back to you as soon as possible.
            </p>
            <a 
              href="mailto:info@coinpredictiontool.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Email Us
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}