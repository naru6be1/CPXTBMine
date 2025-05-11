import React from 'react';
import { Button } from '@/components/ui/button';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { useToast } from '@/hooks/use-toast';

type ForceLoginButtonProps = {
  className?: string;
};

/**
 * A special button component that uses the force-login mechanism
 * for development and mobile environments where Google OAuth
 * may have cookie handling issues.
 */
export default function ForceLoginButton({ className = '' }: ForceLoginButtonProps) {
  const { login } = useSocialLogin();
  const { toast } = useToast();

  const handleForceLogin = async () => {
    toast({
      title: 'Development Login',
      description: 'Attempting direct login...',
      duration: 3000,
    });

    try {
      await login('google'); // This will detect dev environment and use force-login
    } catch (error) {
      console.error('Force login failed:', error);
      toast({
        title: 'Login Failed',
        description: 'Could not complete login. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleForceLogin}
    >
      Direct Login
    </Button>
  );
}