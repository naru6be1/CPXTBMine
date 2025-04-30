import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      const res = await apiRequest('POST', '/api/forgot-password', data);
      const result = await res.json();
      
      // Check if the response indicates no user found with this email
      if (res.status === 404) {
        throw new Error("No account found with this email address. If you haven't set up your email yet, please go to your profile page first.");
      }
      
      return result;
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: 'Email Sent',
        description: 'If your email is registered with us, you will receive a password reset link shortly.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [resetLink, setResetLink] = useState<string | null>(null);
  const isDev = import.meta.env.MODE === 'development';

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setResetLink(null);
    forgotPasswordMutation.mutate(data, {
      onSuccess: (response: any) => {
        console.log('Forgot password response:', response);
        
        // In development mode, check if the response contains a reset URL or token
        if (isDev) {
          // If server provided a complete URL, use that
          if (response.resetUrl) {
            console.log('Server provided reset URL:', response.resetUrl);
            setResetLink(response.resetUrl);
          } 
          // Otherwise if we have a dev token, construct the URL
          else if (response.devToken) {
            const resetUrl = `${window.location.origin}/reset-password?token=${response.devToken}`;
            console.log('Generated reset link from token:', resetUrl);
            setResetLink(resetUrl);
          }
        }
      }
    });
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <p>Check your email for a password reset link.</p>
              <p className="text-sm text-muted-foreground">
                Don't see it? Check your spam folder or request another link.
              </p>
              
              {/* Development mode reset link display */}
              {isDev && resetLink && (
                <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-md">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Development Mode Reset Link</h4>
                  <p className="text-xs text-yellow-700 mb-3">
                    Since we're in development mode, you can use this direct link to reset your password:
                  </p>
                  <div className="p-3 bg-yellow-100 rounded-md overflow-x-auto text-xs mb-3">
                    <a 
                      href={resetLink} 
                      className="text-blue-600 hover:underline break-all"
                    >
                      {resetLink}
                    </a>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800"
                    onClick={() => window.open(resetLink, '_blank')}
                  >
                    Open Reset Link in New Tab
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            <Link href="/auth" className="text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}