// The part to replace
<div className="space-y-4">
  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md text-center space-y-2">
    <h3 className="font-medium text-blue-900 dark:text-blue-100">Sign in to Pay</h3>
    <p className="text-sm text-blue-700 dark:text-blue-300">
      Connect with your social account to create a wallet and complete this payment.
    </p>
  </div>
  
  {/* Use BasicSocialLogin component for more reliable authentication */}
  <BasicSocialLogin 
    showCard={false}
    onSuccess={(userData) => {
      console.log("Social login successful with BasicSocialLogin component:", userData);
      
      // Force reload to apply the changes from localStorage
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }}
    onError={(error) => {
      console.error("Social login failed with BasicSocialLogin component:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Could not complete the login process",
        variant: "destructive",
      });
    }}
  />
</div>