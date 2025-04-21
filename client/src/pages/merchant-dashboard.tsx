import { useEffect, useState } from "react";
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
import { ClipboardCopy, Copy, Download, Info, QrCode, RefreshCw } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { QRCodeSVG } from 'qrcode.react';
import { User } from "@shared/schema";

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
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData?.id,
  });

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
      console.log("Creating payment with merchant:", selectedMerchant);
      console.log("Payment form data:", formData);
      
      // Add API key as header
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-API-Key': selectedMerchant?.apiKey || ""
      });
      
      console.log("Request headers:", {
        'Content-Type': 'application/json',
        'X-API-Key': selectedMerchant?.apiKey ? `${selectedMerchant.apiKey.substring(0, 4)}...` : "missing"
      });
      
      const res = await fetch("/api/payments", {
        method: "POST",
        headers,
        body: JSON.stringify(formData)
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const error = await res.json();
        console.error("Payment creation error:", error);
        throw new Error(error.message || "Failed to create payment");
      }
      
      return await res.json();
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
    
    if (!selectedMerchant) {
      toast({
        title: "Select a merchant",
        description: "Please select a merchant account first",
        variant: "destructive",
      });
      // Redirect to business tab if no merchant is selected
      setActiveTab("business");
      return;
    }
    
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

  // This useEffect will run when merchant data loads
  useEffect(() => {
    if (merchantData?.merchants && merchantData.merchants.length > 0) {
      // Always set the selected merchant when data loads
      setSelectedMerchant(merchantData.merchants[0]);
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
              <CardHeader>
                <CardTitle>Your Business Accounts</CardTitle>
                <CardDescription>
                  Manage your registered businesses
                </CardDescription>
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
                  {merchantData?.merchants && merchantData.merchants.length > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="merchantSelect">Select Business</Label>
                      <select
                        id="merchantSelect"
                        className="w-full p-2 border rounded-md"
                        value={selectedMerchant?.id}
                        onChange={(e) => {
                          const id = parseInt(e.target.value);
                          const merchant = merchantData.merchants?.find((m: any) => m.id === id);
                          if (merchant) {
                            setSelectedMerchant(merchant);
                          }
                        }}
                      >
                        {merchantData.merchants.map((merchant: any) => (
                          <option key={merchant.id} value={merchant.id}>
                            {merchant.businessName}
                          </option>
                        ))}
                      </select>
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
                  <div className="bg-white p-6 rounded-lg mb-4">
                    <QRCodeSVG 
                      value={currentPayment.qrCodeData}
                      size={200}
                      level="H"
                      className="w-full h-auto"
                    />
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
                      The customer should scan the QR code with their wallet app that supports CPXTB token on Base network.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">3. Customer Sends CPXTB</h3>
                    <p className="text-sm text-muted-foreground">
                      The customer sends exactly {Number(currentPayment.payment.amountCpxtb).toFixed(6)} CPXTB to your wallet address:
                    </p>
                    <code className="text-xs bg-muted p-2 rounded block break-all">
                      {selectedMerchant?.walletAddress}
                    </code>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">4. Payment Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      After the customer completes the payment, they should provide you with the transaction hash. You can enter this hash in your payment history to verify the payment.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Important Notes</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>This payment request will expire in 15 minutes.</li>
                      <li>The CPXTB amount is calculated based on the current exchange rate.</li>
                      <li>Make sure the customer sends the exact amount of CPXTB.</li>
                    </ul>
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
              <p className="mb-6 text-center">
                Payment history will be displayed here when you create payments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}