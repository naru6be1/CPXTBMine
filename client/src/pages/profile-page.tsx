import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { User } from '@shared/schema';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { address } = useWallet();
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState(false);
  
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (data: EmailFormValues) => {
      const res = await apiRequest('POST', '/api/update-email', data);
      return await res.json();
    },
    onSuccess: () => {
      setEmailUpdateSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Email Updated',
        description: 'Your email has been updated successfully.',
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

  const onSubmit = (data: EmailFormValues) => {
    updateEmailMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View and manage your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Wallet Address</h3>
              <p className="font-mono text-sm break-all">{address}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Referral Code</h3>
              <p className="font-mono text-sm">{user?.referralCode || 'Not available'}</p>
            </div>
            
            {user?.referredBy && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Referred By</h3>
                <p className="font-mono text-sm">{user.referredBy as string}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>
              Update your email address to receive important notifications and reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your email is used for password recovery and important notifications.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {emailUpdateSuccess && (
                  <div className="py-2 px-3 bg-green-50 text-green-700 text-sm rounded-md">
                    Email updated successfully!
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={updateEmailMutation.isPending}
                >
                  {updateEmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Email'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <Separator className="my-8" />
      
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Password Reset</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you need to reset your password, you must have an email address associated with your account.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/forgot-password'}
              disabled={!user?.email}
            >
              Reset Password
            </Button>
            
            {!user?.email && (
              <p className="mt-2 text-sm text-amber-600">
                Please update your email address above to enable password reset.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col items-start">
          <p className="text-sm text-muted-foreground mb-2">
            Account security is important. Make sure to use a strong, unique password and keep your email address updated.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}