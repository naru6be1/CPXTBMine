import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect, useLocation } from "wouter";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ClipboardCopy, Copy, Download, Info, QrCode, RefreshCw, Clock, Plus } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { QRCodeSVG } from 'qrcode.react';
import { User } from "@shared/schema";

// CPXTB token address for displaying in UI
const CPXTB_TOKEN_ADDRESS = "0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isConnected, address: walletAddress, connect } = useWallet();
  const [activeTab, setActiveTab] = useState("business");

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

  // Selected merchant for payment
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

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

  // The ProtectedRoute component will now handle the authentication check
  // We don't need the manual redirect anymore since the component will only render
  // if the user is authenticated

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
                    Manage your registered businesses
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    console.log("Manual refresh of merchant data requested");
                    refetchMerchants();
                    toast({
                      title: "Refreshing",
                      description: "Updating business accounts list",
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {isMerchantLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : merchantData?.merchants?.length ? (
                  <div className="space-y-4">
                    {merchantData.merchants.map((merchant: any) => (
                      <Card key={merchant.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 p-4">
                          <CardTitle className="text-lg">{merchant.businessName}</CardTitle>
                          <CardDescription>{merchant.businessType}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                          <div className="grid grid-cols-[100px_1fr] gap-1 items-center mt-4">
                            <span className="text-sm text-muted-foreground">Wallet:</span>
                            <code className="text-xs bg-muted p-1 rounded flex items-center gap-1">
                              {merchant.walletAddress.substring(0, 6)}...{merchant.walletAddress.substring(merchant.walletAddress.length - 4)}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4"
                                onClick={() => {
                                  navigator.clipboard.writeText(merchant.walletAddress);
                                  toast({
                                    title: "Copied",
                                    description: "Wallet address copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </code>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                            <span className="text-sm text-muted-foreground">API Key:</span>
                            <code className="text-xs bg-muted p-1 rounded">{merchant.apiKey}</code>
                          </div>
                          <div className="grid grid-cols-[100px_1fr] gap-1 items-center">
                            <span className="text-sm text-muted-foreground">Contact:</span>
                            <span className="text-sm">{merchant.contactEmail}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 p-2 flex justify-end">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setSelectedMerchant(merchant);
                              setActiveTab("payments");
                            }}
                          >
                            Create Payment
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <Info className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No business accounts found</p>
                    <p className="text-sm text-muted-foreground">Register your first business to accept CPXTB payments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Creation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Payment Request</CardTitle>
                <CardDescription>
                  Generate a payment request for your customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Current Selected Business Display */}
                {selectedMerchant && (
                  <div className="mb-4 p-3 border rounded-md bg-muted/20">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-medium">{selectedMerchant.businessName}</h3>
                      <p className="text-sm text-muted-foreground">{selectedMerchant.businessType}</p>
                    </div>
                    <div className="mt-2 text-xs flex items-center">
                      <span className="text-muted-foreground mr-2">Receiving wallet:</span>
                      <code className="bg-muted p-1 rounded">
                        {selectedMerchant.walletAddress.substring(0, 8)}...{selectedMerchant.walletAddress.substring(selectedMerchant.walletAddress.length - 8)}
                      </code>
                    </div>
                  </div>
                )}
                <form onSubmit={handleCreatePayment} className="space-y-4">
                  {merchantData?.merchants && merchantData.merchants.length > 0 && (
                    <div className="space-y-2 border-b pb-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="merchantSelect" className="text-base font-medium">Select Business Account</Label>
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("business")}
                        >
                          Manage Businesses
                        </Button>
                      </div>
                      
                      <div className="bg-muted/30 p-4 rounded-md">
                        <select
                          id="merchantSelect"
                          className="w-full p-3 border border-input rounded-md bg-background mb-2"
                          value={selectedMerchant?.id || ""}
                          onChange={(e) => {
                            const id = parseInt(e.target.value);
                            const merchant = merchantData.merchants.find((m: any) => m.id === id);
                            if (merchant) {
                              console.log(`Selected merchant: ${merchant.businessName} (ID: ${merchant.id})`);
                              console.log(`API Key available: ${!!merchant.apiKey}`);
                              setSelectedMerchant(merchant);
                            }
                          }}
                        >
                          <option value="" disabled>-- Select Business --</option>
                          {merchantData.merchants.map((merchant: any) => (
                            <option key={merchant.id} value={merchant.id}>
                              {merchant.businessName} - {merchant.businessType}
                            </option>
                          ))}
                        </select>
                        
                        {selectedMerchant && (
                          <div className="mt-2 text-sm space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Merchant ID:</span>
                              <span className="font-medium">{selectedMerchant.id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">API Key Status:</span>
                              <span className={`font-medium ${selectedMerchant.apiKey ? 'text-green-500' : 'text-red-500'}`}>
                                {selectedMerchant.apiKey ? 'Available' : 'Missing'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Wallet Address:</span>
                              <span className="font-mono text-xs">{selectedMerchant.walletAddress.substring(0, 6)}...{selectedMerchant.walletAddress.substring(selectedMerchant.walletAddress.length - 4)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="amountUsd">Amount (USD)</Label>
                    <Input 
                      id="amountUsd"
                      name="amountUsd"
                      type="number"
                      step="0.01"
                      min="0.1"
                      placeholder="10.00"
                      value={paymentForm.amountUsd}
                      onChange={handlePaymentFormChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orderId">Order ID</Label>
                    <Input 
                      id="orderId"
                      name="orderId"
                      placeholder="Order reference"
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
                      placeholder="Payment details"
                      value={paymentForm.description}
                      onChange={handlePaymentFormChange}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? 'Creating...' : 'Create Payment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Selected Business Info */}
            {selectedMerchant && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Business</CardTitle>
                  <CardDescription>
                    Payment will be created for this business
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{selectedMerchant.businessName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedMerchant.businessType}</p>
                  </div>
                  
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <span className="text-sm font-medium">Wallet Address:</span>
                    <code className="text-xs bg-muted p-1 rounded">
                      {selectedMerchant.walletAddress.substring(0, 8)}...{selectedMerchant.walletAddress.substring(selectedMerchant.walletAddress.length - 8)}
                    </code>
                  </div>
                  
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <span className="text-sm font-medium">API Key:</span>
                    <code className="text-xs bg-muted p-1 rounded">{selectedMerchant.apiKey}</code>
                  </div>
                  
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <span className="text-sm font-medium">Contact Email:</span>
                    <span className="text-sm">{selectedMerchant.contactEmail}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="qrcode">
          {currentPayment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Payment QR Code</CardTitle>
                  <CardDescription>
                    Share this QR code with your customer to receive payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  <div className="space-y-2">
                    <div className="bg-white p-6 rounded-lg">
                      <QRCodeSVG 
                        value={currentPayment.qrCodeData}
                        size={240}
                        level="H"
                        className="w-full h-auto"
                      />
                    </div>
                    {currentPayment.paymentInstructions && (
                      <p className="text-sm text-center font-medium text-black dark:text-white bg-amber-100 dark:bg-amber-800 p-2 rounded-md border border-amber-300 dark:border-amber-700 shadow-sm">
                        {currentPayment.paymentInstructions}
                      </p>
                    )}
                  </div>
                  <div className="text-center mb-4 space-y-3">
                    <div className="text-sm px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-800 rounded-lg flex items-center justify-center gap-2 font-semibold">
                      <AlertCircle className="h-5 w-5" />
                      WARNING: Send CPXTB tokens, NOT ETH/BASE coins!
                    </div>
                    <div className="text-base font-medium border-2 border-yellow-500 bg-yellow-100 dark:bg-yellow-900 dark:border-yellow-600 p-3 rounded-lg text-black dark:text-white shadow-md">
                      Send exactly <span className="font-bold text-lg underline text-black dark:text-white">{Number(currentPayment.payment.amountCpxtb).toFixed(6)} CPXTB tokens</span> to this address
                    </div>
                    <div className="text-sm text-black dark:text-white bg-red-100 dark:bg-red-950 p-3 rounded-lg border border-red-300 dark:border-red-700 font-medium shadow-md">
                      ⚠️ WARNING: Sending any other token or incorrect amount will result in lost funds!
                    </div>
                  </div>
                  
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <Label>Payment Reference</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={currentPayment.payment.reference}
                          readOnly
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(currentPayment.payment.reference);
                            toast({
                              title: "Copied",
                              description: "Payment reference copied to clipboard",
                            });
                          }}
                        >
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount (USD)</Label>
                        <Input 
                          value={`$${Number(currentPayment.payment.amountUsd).toFixed(2)}`}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (CPXTB)</Label>
                        <Input 
                          value={`${Number(currentPayment.payment.amountCpxtb).toFixed(6)} CPXTB`}
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          currentPayment.payment.status === 'completed' 
                            ? 'bg-green-500' 
                            : currentPayment.payment.status === 'expired'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }`} />
                        <span className="capitalize">{currentPayment.payment.status}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Expires At</Label>
                      <Input 
                        value={new Date(currentPayment.payment.expiresAt).toLocaleString()}
                        readOnly
                      />
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        className="w-full"
                        onClick={() => setActiveTab("payments")}
                      >
                        Create Another Payment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Payment Instructions</CardTitle>
                  <CardDescription>
                    How to receive CPXTB tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">1. Share with Customer</h3>
                    <p className="text-sm text-muted-foreground">
                      Show the QR code to your customer or share the payment details.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">2. Customer Scans QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      The customer should scan the QR code with any wallet app to get your wallet address (or copy the address below).
                    </p>
                    <div className="bg-red-100 dark:bg-red-950 border-2 border-red-400 dark:border-red-900 rounded p-3 text-sm flex items-start gap-2 shadow-md">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-black dark:text-red-400 mb-1">⚠️ IMPORTANT: CPXTB TOKENS ONLY!</p>
                        <p className="text-black dark:text-white font-medium">After scanning, the customer needs to send the exact amount of <strong className="text-black dark:text-white bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded-sm underline">{Number(currentPayment.payment.amountCpxtb).toFixed(6)} CPXTB</strong> tokens to your address.</p>
                        <p className="mt-1 text-xs font-bold text-black dark:text-red-400">Do NOT send ETH or BASE coins - they will be lost!</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">3. Customer Sends CPXTB</h3>
                    <p className="text-sm font-medium text-black dark:text-white">
                      The customer sends exactly <span className="bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded font-bold">{Number(currentPayment.payment.amountCpxtb).toFixed(6)} CPXTB</span> to your wallet address:
                    </p>
                    <div className="flex items-center">
                      <code className="text-xs bg-muted p-2 rounded-l block break-all w-full">
                        {currentPayment.payment.merchantWalletAddress}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 rounded-l-none"
                        onClick={() => {
                          navigator.clipboard.writeText(currentPayment.payment.merchantWalletAddress);
                          toast({
                            title: "Copied",
                            description: "Wallet address copied to clipboard",
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">4. Payment Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      After the customer completes the payment, they should provide you with the transaction hash. You can enter this hash in your payment history to verify the payment.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">CPXTB Token Details</h3>
                    <p className="text-sm text-muted-foreground">
                      If the customer needs to add the CPXTB token to their wallet:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Token Contract:</span>
                        <div className="flex items-center">
                          <code className="text-xs bg-muted px-2 py-1 rounded-l">{CPXTB_TOKEN_ADDRESS}</code>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-6 w-6 rounded-l-none"
                            onClick={() => {
                              navigator.clipboard.writeText(CPXTB_TOKEN_ADDRESS);
                              toast({
                                title: "Copied",
                                description: "Token contract address copied",
                              });
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Network:</span>
                        <span className="text-xs">Base (Chain ID: 8453)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Token Symbol:</span>
                        <span className="text-xs">CPXTB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Decimals:</span>
                        <span className="text-xs">18</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Important Notes
                    </h3>
                    <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-md p-3">
                      <ul className="text-sm text-black dark:text-white list-disc pl-5 space-y-2">
                        <li><strong>Time limit:</strong> This payment request will expire in <span className="font-bold underline">15 minutes</span>.</li>
                        <li><strong>Exchange rate:</strong> The CPXTB amount is calculated based on the current exchange rate.</li>
                        <li><strong>Exact amount:</strong> Make sure the customer sends <span className="font-bold text-orange-700 dark:text-orange-400">exactly {Number(currentPayment.payment.amountCpxtb).toFixed(6)} CPXTB</span> - no more, no less.</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View and manage your payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4 py-6">
                <div className="mx-auto bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No payment history yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your completed payment transactions will appear here. Create a new payment in the Payments tab to get started.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("payments")}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}