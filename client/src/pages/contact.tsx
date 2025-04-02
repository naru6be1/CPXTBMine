import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

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
            href="https://t.me/CPXTBase" 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              window.open('https://t.me/CPXTBase', '_blank', 'noopener,noreferrer');
            }}
          >
            <Button className="w-full sm:w-auto">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Support on Telegram
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}