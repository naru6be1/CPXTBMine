import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from 'qrcode.react';
import { User } from "@shared/schema";

// CPXTB token address for displaying in UI
const CPXTB_TOKEN_ADDRESS = "0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isConnected, address: walletAddress, connect } = useWallet();
  const [activeTab, setActiveTab] = useState("business");

  // Selected merchant for payment
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  // Get user data
  const { data: userData } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Get merchant accounts for the user
  const { data: merchantData, isLoading: isMerchantLoading, refetch: refetchMerchants } = useQuery<{ merchants: any[] }>({
    queryKey: ["/api/users", userData?.id, "merchants"], 
    // Custom fetch function to force authentication check
    queryFn: async ({ queryKey }) => {
      console.log("Fetching merchant data with key:", queryKey);
      
      if (!userData) {
        console.error("Cannot fetch merchants - user not logged in");
        toast({
          title: "Authentication required",
          description: "Please log in to access your merchant accounts",
          variant: "destructive",
        });
        return { merchants: [] };
      }
      
      try {
        const response = await fetch(`/api/users/${userData.id}/merchants`);
        if (!response.ok) {
          throw new Error("Failed to fetch merchant data: " + response.statusText);
        }
        
        const data = await response.json();
        console.log(`Loaded ${data.merchants?.length || 0} merchants`);
        return data;
      } catch (error) {
        console.error("Error fetching merchants:", error);
        toast({
          title: "Error loading merchants",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
        return { merchants: [] };
      }
    },
    enabled: !!userData?.id,
    // Ensure we get fresh data on each mount
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  // Debug merchant data
  useEffect(() => {
    if (merchantData) {
      console.log("Merchant data loaded:", {
        merchantCount: merchantData?.merchants?.length || 0,
        merchantIds: merchantData?.merchants?.map(m => m.id) || []
      });
    }
  }, [merchantData]);

  // Merchant registration state
  const [merchantForm, setMerchantForm] = useState({
    businessName: "",
    businessType: "",
    walletAddress: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    description: ""
  });

  // Payment creation state
  const [paymentForm, setPaymentForm] = useState({
    amountUsd: "",
    orderId: "",
    description: ""
  });

  // QR Code and payment data
  const [currentPayment, setCurrentPayment] = useState<any>(null);
  
  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    if (!selectedMerchant) {
      console.error("Cannot fetch payment history - no merchant selected");
      return;
    }
    
    const apiKey = selectedMerchant.apiKey;
    if (!apiKey || apiKey.includes('...')) {
      toast({
        title: "Error loading payment history",
        description: "Invalid API key - please refresh the page",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoadingHistory(true);
      
      // Fetch payments for the selected merchant
      const response = await fetch('/api/merchants/payments', {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to load payment history");
      }
      
      const data = await response.json();
      console.log("Payment history loaded:", data);
      setPaymentHistory(data.payments || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      toast({
        title: "Failed to load payment history",
        description: "Please try again later",
        variant: "destructive",
      });
      setPaymentHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedMerchant, toast]);

  // Create merchant mutation
  const createMerchantMutation = useMutation({
    mutationFn: async (formData: typeof merchantForm) => {
      // Make sure we have user data
      if (!userData?.id) {
        throw new Error("User not authenticated. Please log in.");
      }
      
      // Convert empty website to undefined (not null) to pass validation
      // and ensure userId is a number
      const dataToSend = {
        ...formData,
        // If website is empty or just whitespace, don't send it at all
        ...(formData.website && formData.website.trim() ? { website: formData.website } : {}),
        // Ensure userId is a number
        userId: Number(userData.id)
      };
      
      console.log("Sending merchant data:", dataToSend);
      const res = await apiRequest("POST", "/api/merchants", dataToSend);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Business account created",
        description: "Your merchant account has been created successfully.",
      });
      refetchMerchants();
      setActiveTab("payments");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (formData: typeof paymentForm & { merchantId: number }) => {
      // Validate merchant selection
      if (!selectedMerchant) {
        throw new Error("Please select a merchant account first");
      }

      // Extract full API key (not masked) from the selected merchant
      const apiKey = selectedMerchant.apiKey;
      if (!apiKey || apiKey.includes('...')) {
        throw new Error("Invalid API key - please refresh the page to get full API keys");
      }
      
      console.log("Creating payment for merchant:", selectedMerchant.businessName);
      console.log("Using merchant ID:", selectedMerchant.id);
      
      // Define data to send - explicitly extract from form data and selectedMerchant
      const paymentData = {
        amountUsd: formData.amountUsd,
        orderId: formData.orderId,
        description: formData.description,
        merchantId: selectedMerchant.id
      };
      
      // Add API key header
      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      };
      
      // Use direct fetch with explicit headers
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(paymentData)
      });
      
      // Enhanced error handling
      if (!response.ok) {
        let errorText = "Failed to create payment request";
        try {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
          console.error("Payment error details:", errorData);
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorText);
      }
      
      const data = await response.json();
      console.log("Payment created successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Payment created",
        description: "Payment request has been created successfully.",
      });
      setCurrentPayment(data);
      setActiveTab("qrcode");
    },
    onError: (error: Error) => {
      toast({
        title: "Payment creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle merchant registration
  const handleMerchantRegister = (e: React.FormEvent) => {
    e.preventDefault();
    createMerchantMutation.mutate(merchantForm);
  };

  // Handle payment creation
  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug information about form submission
    console.log("Payment form submission. Current state:", {
      hasSelectedMerchant: !!selectedMerchant,
      merchantId: selectedMerchant?.id,
      merchantName: selectedMerchant?.businessName,
      hasApiKey: !!selectedMerchant?.apiKey,
      formData: paymentForm
    });
    
    // Enhanced validation for selected merchant
    if (!selectedMerchant) {
      console.error("No merchant selected during payment submission");
      toast({
        title: "Select a merchant",
        description: "Please select a merchant account first",
        variant: "destructive",
      });
      // Try to set a merchant if available but not selected
      if (merchantData?.merchants && merchantData.merchants.length > 0) {
        console.log("Attempting to select the first available merchant");
        setSelectedMerchant(merchantData.merchants[0]);
      } else {
        // Redirect to business tab if no merchant is available
        setActiveTab("business");
      }
      return;
    }
    
    // Validate API key presence
    if (!selectedMerchant.apiKey) {
      console.error("Selected merchant has no API key:", selectedMerchant.id);
      toast({
        title: "Invalid merchant account",
        description: "The selected merchant account has no API key",
        variant: "destructive",
      });
      // Redirect to business tab to select a different merchant
      setActiveTab("business");
      return;
    }
    
    // Amount validation
    if (!paymentForm.amountUsd || parseFloat(paymentForm.amountUsd) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }
    
    // Order ID validation
    if (!paymentForm.orderId || paymentForm.orderId.trim() === '') {
      toast({
        title: "Missing order ID",
        description: "Please enter an order ID for this payment",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Submitting payment with validated merchant:", {
      id: selectedMerchant.id,
      businessName: selectedMerchant.businessName,
      apiKeyPresent: !!selectedMerchant.apiKey
    });
    
    createPaymentMutation.mutate({
      ...paymentForm,
      // Ensure amountUsd is sent as a string to match the schema
      amountUsd: String(paymentForm.amountUsd),
      merchantId: selectedMerchant.id
    });
  };

  // Handle form changes
  const handleMerchantFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMerchantForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Payment verification form state
  const [verificationForm, setVerificationForm] = useState({
    reference: "",
    transactionHash: ""
  });
  
  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (data: typeof verificationForm) => {
      if (!selectedMerchant) {
        throw new Error("Please select a merchant account first");
      }
      
      const apiKey = selectedMerchant.apiKey;
      if (!apiKey || apiKey.includes('...')) {
        throw new Error("Invalid API key - please refresh the page to get full API keys");
      }
      
      // Call the verification API endpoint
      const response = await fetch(`/api/payments/${data.reference}/verify`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ transactionHash: data.transactionHash })
      });
      
      if (!response.ok) {
        let errorText = "Failed to verify payment";
        try {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorText);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment verified",
        description: "Payment has been verified and marked as completed.",
      });
      // Reset form
      setVerificationForm({
        reference: "",
        transactionHash: ""
      });
      // Refresh payment history
      fetchPaymentHistory();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle payment verification
  const handleVerifyPayment = () => {
    if (!verificationForm.reference || !verificationForm.transactionHash) {
      toast({
        title: "Missing information",
        description: "Please enter both payment reference and transaction hash",
        variant: "destructive",
      });
      return;
    }
    
    // Validate transaction hash format
    if (!verificationForm.transactionHash.startsWith('0x')) {
      toast({
        title: "Invalid transaction hash",
        description: "Transaction hash must start with '0x'",
        variant: "destructive",
      });
      return;
    }
    
    verifyPaymentMutation.mutate(verificationForm);
  };

  // This effect runs once when component mounts to ensure merchant data is loaded
  useEffect(() => {
    if (userData?.id) {
      console.log("Component mounted with user ID:", userData.id);
      // Force a fresh reload of merchant data on mount
      refetchMerchants().then((result) => {
        console.log("Initial merchant data fetch complete:", {
          success: !result.isError,
          merchantCount: result.data?.merchants?.length || 0
        });
      });
    }
  }, [userData?.id, refetchMerchants]);
  
  // This useEffect will run when merchant data loads
  useEffect(() => {
    if (merchantData?.merchants && merchantData.merchants.length > 0) {
      // Always set the selected merchant when data loads
      const firstMerchant = merchantData.merchants[0];
      console.log("Setting initial merchant:", {
        id: firstMerchant.id,
        businessName: firstMerchant.businessName,
        hasApiKey: !!firstMerchant.apiKey
      });
      setSelectedMerchant(firstMerchant);
    } else {
      console.log("No merchants available to select");
    }
  }, [merchantData]);
  
  // This useEffect redirects to business tab if no merchants are found when trying to create payment
  useEffect(() => {
    if (activeTab === "payments" && merchantData && merchantData.merchants && merchantData.merchants.length === 0) {
      setActiveTab("business");
      toast({
        title: "No merchant account found",
        description: "Please register a business account first",
        variant: "default",
      });
    }
  }, [activeTab, merchantData, toast]);
  
  // This useEffect fetches payment history when the history tab is active
  useEffect(() => {
    if (activeTab === "history" && selectedMerchant) {
      console.log("History tab activated, fetching payment history...");
      fetchPaymentHistory();
    }
  }, [activeTab, selectedMerchant, fetchPaymentHistory]);

  return (
    <div className="container my-8">
      <h1 className="text-3xl font-bold mb-6">Merchant Dashboard</h1>
      <p className="mb-8 text-muted-foreground">
        Accept CPXTB token payments for your business
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="business">Business Setup</TabsTrigger>
          <TabsTrigger value="payments" disabled={!merchantData?.merchants?.length}>Create Payment</TabsTrigger>
          <TabsTrigger value="qrcode" disabled={!currentPayment}>Payment QR Code</TabsTrigger>
          <TabsTrigger value="history" disabled={!merchantData?.merchants?.length}>Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Register Business</CardTitle>
                <CardDescription>
                  Create a new business account to accept CPXTB token payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMerchantRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input 
                      id="businessName"
                      name="businessName"
                      placeholder="Your business name"
                      value={merchantForm.businessName}
                      onChange={handleMerchantFormChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input 
                      id="businessType"
                      name="businessType"
                      placeholder="e.g. Retail, Services, E-commerce"
                      value={merchantForm.businessType}
                      onChange={handleMerchantFormChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="walletAddress">
                      Wallet Address 
                      {isConnected && (
                        <Button 
                          variant="link" 
                          className="h-auto p-0 ml-2"
                          onClick={() => setMerchantForm(prev => ({
                            ...prev,
                            walletAddress: walletAddress || ""
                          }))}
                        >
                          Use connected wallet
                        </Button>
                      )}
                    </Label>
                    <Input 
                      id="walletAddress"
                      name="walletAddress"
                      placeholder="0x..."
                      value={merchantForm.walletAddress}
                      onChange={handleMerchantFormChange}
                      required
                    />
                    {!isConnected && (
                      <Button
                        type="button" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={connect}
                      >
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input 
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      placeholder="Your email address"
                      value={merchantForm.contactEmail}
                      onChange={handleMerchantFormChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                    <Input 
                      id="contactPhone"
                      name="contactPhone"
                      placeholder="Your phone number"
                      value={merchantForm.contactPhone}
                      onChange={handleMerchantFormChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input 
                      id="website"
                      name="website"
                      placeholder="https://yourbusiness.com"
                      value={merchantForm.website}
                      onChange={(e) => {
                        // Ensure URL has protocol if not empty
                        let value = e.target.value;
                        if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                          value = 'https://' + value;
                        }
                        setMerchantForm(prev => ({ ...prev, website: value }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">URL must include https:// or http://</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input 
                      id="description"
                      name="description"
                      placeholder="Brief description of your business"
                      value={merchantForm.description}
                      onChange={handleMerchantFormChange}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={createMerchantMutation.isPending}
                  >
                    {createMerchantMutation.isPending ? 'Registering...' : 'Register Business'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Business Accounts List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Your Business Accounts</CardTitle>
                  <CardDescription>
                    Select a business account to manage payments
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isMerchantLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading merchant accounts...</p>
                  </div>
                ) : merchantData?.merchants?.length ? (
                  <div className="space-y-4">
                    {merchantData.merchants.map((merchant) => (
                      <Card key={merchant.id} className={`cursor-pointer transition-colors ${selectedMerchant?.id === merchant.id ? 'border-primary' : 'border-border'}`}
                        onClick={() => setSelectedMerchant(merchant)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium">{merchant.businessName}</h3>
                              <p className="text-sm text-muted-foreground">{merchant.businessType}</p>
                              <div className="mt-1 text-xs text-muted-foreground flex items-center">
                                <span className="inline-block bg-muted rounded-full h-2 w-2 mr-2"></span>
                                {merchant.walletAddress.substring(0, 8)}...{merchant.walletAddress.substring(merchant.walletAddress.length - 8)}
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">ID: {merchant.id}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-[100px_1fr] gap-1 items-center mt-4">
                            <span className="text-sm text-muted-foreground">API Key:</span>
                            <code className="text-xs bg-muted p-1 rounded overflow-hidden text-ellipsis">
                              {merchant.apiKey.substring(0, 10)}...
                            </code>
                            
                            <span className="text-sm text-muted-foreground">Email:</span>
                            <span className="text-sm truncate">{merchant.contactEmail}</span>
                            
                            {merchant.website && (
                              <>
                                <span className="text-sm text-muted-foreground">Website:</span>
                                <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                                  {merchant.website.replace(/^https?:\/\//, '')}
                                </a>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg border-dashed">
                    <p className="text-muted-foreground mb-4">No merchant accounts yet</p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Register your business to start accepting CPXTB token payments from your customers
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Payment Request</CardTitle>
              <CardDescription>
                Generate a QR code payment for your customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  {/* Merchant Selection */}
                  <div className="mb-6">
                    <Label htmlFor="merchantId" className="mb-2 block">Select Business Account</Label>
                    <select 
                      id="merchantId"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={selectedMerchant?.id || ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const merchant = merchantData?.merchants?.find(m => m.id === id);
                        if (merchant) {
                          setSelectedMerchant(merchant);
                        }
                      }}
                    >
                      <option value="" disabled>Select a business account</option>
                      {merchantData?.merchants?.map(merchant => (
                        <option key={merchant.id} value={merchant.id}>
                          {merchant.businessName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Selected Merchant Info */}
                  {selectedMerchant && (
                    <Card className="mb-6 bg-muted/50">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium">{selectedMerchant.businessName}</h3>
                        <p className="text-sm text-muted-foreground">{selectedMerchant.businessType}</p>
                        <div className="mt-1 text-xs text-muted-foreground flex items-center">
                          <span className="inline-block bg-muted rounded-full h-2 w-2 mr-2"></span>
                          {selectedMerchant.walletAddress.substring(0, 8)}...{selectedMerchant.walletAddress.substring(selectedMerchant.walletAddress.length - 8)}
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground mt-2">API Key:</div>
                          <code className="text-xs bg-muted p-1 rounded">{selectedMerchant.apiKey}</code>
                        </div>
                        <div className="mt-1">
                          <div className="text-xs text-muted-foreground">Contact:</div>
                          <span className="text-sm">{selectedMerchant.contactEmail}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Payment Form */}
                  <form onSubmit={handleCreatePayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amountUsd">Amount (USD)</Label>
                      <Input 
                        id="amountUsd"
                        name="amountUsd"
                        type="number"
                        step="0.01"
                        placeholder="Amount in USD"
                        value={paymentForm.amountUsd}
                        onChange={handlePaymentFormChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="orderId">Order ID / Reference</Label>
                      <Input 
                        id="orderId"
                        name="orderId"
                        placeholder="Unique order identifier"
                        value={paymentForm.orderId}
                        onChange={handlePaymentFormChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input 
                        id="description"
                        name="description"
                        placeholder="Description of the purchase"
                        value={paymentForm.description}
                        onChange={handlePaymentFormChange}
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full"
                      disabled={createPaymentMutation.isPending || !selectedMerchant}
                    >
                      {createPaymentMutation.isPending ? 'Creating...' : 'Create Payment'}
                    </Button>
                  </form>
                </div>
                
                {/* Payment Verification Section */}
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Verify Customer Payment</h3>
                  <p className="text-sm mb-6">
                    After customer makes a payment, verify the transaction to mark it as completed.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reference">Payment Reference</Label>
                      <Input
                        id="reference"
                        placeholder="Enter payment reference"
                        value={verificationForm.reference}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, reference: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="transactionHash">Transaction Hash</Label>
                      <Input
                        id="transactionHash"
                        placeholder="0x..."
                        value={verificationForm.transactionHash}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, transactionHash: e.target.value }))}
                      />
                      <p className="text-xs mt-1 text-muted-foreground">
                        Transaction hash from the customer's payment
                      </p>
                    </div>
                    
                    <Button 
                      type="button" 
                      onClick={handleVerifyPayment}
                      className="w-full"
                      disabled={verifyPaymentMutation.isPending}
                    >
                      {verifyPaymentMutation.isPending ? 'Verifying...' : 'Verify Payment'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcode" className="space-y-4">
          {currentPayment ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment QR Code</CardTitle>
                <CardDescription>
                  Ask your customer to scan this QR code to complete the payment
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800 flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <span>Instruct your customer to:</span>
                    </div>
                    <ol className="text-sm text-yellow-800 list-decimal list-inside pl-4 mt-2 space-y-1">
                      <li>Copy the payment reference</li>
                      <li>Scan the QR code to open the wallet</li>
                      <li>Send exactly <span className="font-bold">{currentPayment.amountCpxtb} CPXTB</span> tokens</li>
                      <li>Provide you with the transaction hash</li>
                    </ol>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-medium">Payment Details:</h3>
                    <div className="mt-2 grid grid-cols-[120px_1fr] gap-1 text-sm">
                      <span className="text-muted-foreground">Reference:</span>
                      <code className="font-mono bg-muted rounded px-2 py-1">{currentPayment.reference}</code>
                      
                      <span className="text-muted-foreground">Amount (USD):</span>
                      <span>${Number(currentPayment.amountUsd).toFixed(2)}</span>
                      
                      <span className="text-muted-foreground">Amount (CPXTB):</span>
                      <span className="font-bold text-primary">{currentPayment.amountCpxtb} CPXTB</span>
                      
                      <span className="text-muted-foreground">Status:</span>
                      <span>{currentPayment.status === 'pending' ? 
                        <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">Pending</span> : 
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Completed</span>
                      }</span>
                      
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(currentPayment.createdAt).toLocaleString()}</span>
                      
                      {currentPayment.description && (
                        <>
                          <span className="text-muted-foreground">Description:</span>
                          <span>{currentPayment.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Label className="mb-2 block">Recipient Wallet Address:</Label>
                    <div className="p-3 bg-primary/5 rounded flex flex-col gap-2 items-center md:items-start mb-4">
                      <code className="font-mono text-xs break-all">{currentPayment.walletAddress}</code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8"
                        onClick={() => {
                          navigator.clipboard.writeText(currentPayment.walletAddress);
                          toast({
                            title: "Address copied",
                            description: "Wallet address copied to clipboard",
                          });
                        }}
                      >
                        Copy Address
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setActiveTab("history");
                        }}
                      >
                        View Payment History
                      </Button>
                      
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setCurrentPayment(null);
                          setPaymentForm({
                            amountUsd: "",
                            orderId: "",
                            description: ""
                          });
                          setActiveTab("payments");
                        }}
                      >
                        Create New Payment
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-8 rounded-lg border max-w-xs mx-auto md:mx-0">
                  <QRCodeSVG 
                    value={`ethereum:${currentPayment.walletAddress}?value=0&tokenAddress=${CPXTB_TOKEN_ADDRESS}&tokenAmount=${currentPayment.amountCpxtb}`}
                    size={240}
                    level="H"
                  />
                  <div className="text-center mt-4">
                    <p className="text-sm font-medium">Scan to pay with CPXTB</p>
                    <p className="text-xs text-muted-foreground mt-1">Payment Reference: {currentPayment.reference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="mb-4">No active payment request</p>
                <Button 
                  onClick={() => setActiveTab("payments")}
                >
                  Create Payment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  View and manage your payment transactions
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchPaymentHistory}
                disabled={isLoadingHistory}
              >
                {isLoadingHistory ? 'Refreshing...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading payment history...</p>
                </div>
              ) : paymentHistory.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-2 text-xs font-medium text-muted-foreground">Reference</th>
                          <th className="text-left p-2 text-xs font-medium text-muted-foreground">Date</th>
                          <th className="text-right p-2 text-xs font-medium text-muted-foreground">Amount (USD)</th>
                          <th className="text-right p-2 text-xs font-medium text-muted-foreground">Amount (CPXTB)</th>
                          <th className="text-left p-2 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-2 text-xs font-medium text-muted-foreground">Transaction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id} className="hover:bg-muted/50">
                            <td className="p-2 font-mono text-xs">{payment.reference}</td>
                            <td className="p-2 text-sm">{new Date(payment.createdAt).toLocaleDateString()}</td>
                            <td className="p-2 text-sm text-right">${Number(payment.amountUsd).toFixed(2)}</td>
                            <td className="p-2 text-sm text-right">{payment.amountCpxtb}</td>
                            <td className="p-2">
                              {payment.status === 'completed' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Completed
                                </span>
                              ) : payment.status === 'expired' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-xs">
                              {payment.transactionHash ? (
                                <a 
                                  href={`https://basescan.org/tx/${payment.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {payment.transactionHash.substring(0, 6)}...{payment.transactionHash.substring(payment.transactionHash.length - 4)}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <p className="text-muted-foreground mb-4">No payment history found</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                    Create a payment request and have your customers pay with CPXTB tokens
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("payments")}>
                    Create Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}