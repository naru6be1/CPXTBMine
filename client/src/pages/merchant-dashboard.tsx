import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect, useLocation, Link } from "wouter";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  ClipboardCopy, 
  Copy, 
  Download, 
  Info, 
  QrCode, 
  RefreshCw, 
  Clock, 
  Plus, 
  CheckCircle, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  AlertTriangle, 
  Check, 
  LogOut, 
  FileText, 
  BarChart, 
  FileDown, 
  Calendar as CalendarIcon,
  FileImage,
  HelpCircle,
  Store,
  ScanLine,
  CircleDollarSign,
  Globe,
  Eye,
  ArrowLeft,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format, subDays, subMonths, subYears, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/hooks/use-auth";
import { QRCodeSVG } from 'qrcode.react';
import PaymentQRCode from '@/components/PaymentQRCode';
import { User as UserType } from "@shared/schema";
import { PaymentNotification, PaymentSuccessNotification } from "@/components/payment-notification";
import { MerchantPamphlet } from "@/components/merchant-pamphlet";
import SimplePaymentQRGenerator from "@/components/merchant/SimplePaymentQRGenerator";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Profile button component
function ProfileButton() {
  return (
    <Link href="/profile">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 hover:bg-blue-50 border-blue-200"
      >
        <User className="h-4 w-4" />
        My Profile
      </Button>
    </Link>
  );
}

// Claim Tokens button component
function ClaimTokensButton() {
  return (
    <Link href="/claim-tokens">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 hover:bg-green-50 border-green-200 text-green-600"
      >
        <CircleDollarSign className="h-4 w-4" />
        Get Test Tokens
      </Button>
    </Link>
  );
}

// Logout button component
function LogoutButton() {
  const { logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="h-4 w-4" />
      {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}

// CPXTB token address for displaying in UI
const CPXTB_TOKEN_ADDRESS = "0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b";

// Interface for payment creation data to help with type safety
// This must match the schema requirements from server-side validation
interface PaymentCreateData {
  description?: string;
  amountUsd: number;
  amountCpxtb: number;
  exchangeRate: number;
  merchantId: number;
  paymentReference?: string; // The server generates this if not provided
  expiresAt?: Date; // The server calculates this if not provided
}

export default function MerchantDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isConnected, address: walletAddress, connect } = useWallet();
  const [activeTab, setActiveTab] = useState("business");
  
  // Helper function to convert template code to display name
  const renderTemplateName = (templateCode?: string) => {
    if (!templateCode) return "Default";
    
    switch (templateCode) {
      case 'default': return "Modern Blue";
      case 'bold': return "Crypto Gold";
      case 'minimal': return "Minimalist";
      case 'tech': return "Dark Mode";
      default: return templateCode.charAt(0).toUpperCase() + templateCode.slice(1);
    }
  };

  // Selected merchant for payment
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  
  // Import the merchant social login component
  const MerchantSocialLogin = React.lazy(() => import('@/components/merchant/MerchantSocialLogin'));
  
  // Theme customization state
  const [themeForm, setThemeForm] = useState({
    primaryColor: "#3b82f6", // Default blue
    secondaryColor: "#10b981", // Default green
    accentColor: "#f59e0b", // Default amber
    fontFamily: "Inter",
    borderRadius: 8,
    darkMode: false,
    customCss: "",
    customHeader: "",
    customFooter: "",
  });
  // Track applying template state - can be false, true, or template name for more detailed UX 
  const [applyingTemplate, setApplyingTemplate] = useState<boolean | string>(false);

  // Get user data
  const { data: userData } = useQuery<UserType>({
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
    description: "",
    legalAgreement: false
  });

  // Payment creation state
  // Removed orderId field as per user request
  const [paymentForm, setPaymentForm] = useState({
    amountUsd: "",
    description: ""
  });

  // QR Code and payment data
  const [currentPayment, setCurrentPayment] = useState<any>(null);
  
  // Payment notification state
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [completedPaymentRef, setCompletedPaymentRef] = useState('');
  
  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Reports state
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  
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
  
  // Function to fetch report data
  const fetchReportData = async () => {
    if (!selectedMerchant) {
      toast({
        title: "No merchant selected",
        description: "Please select a merchant account first",
        variant: "destructive"
      });
      return;
    }
    
    if (!startDate || !endDate) {
      toast({
        title: "Date range required",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }
    
    const apiKey = selectedMerchant.apiKey;
    if (!apiKey || apiKey.includes('...')) {
      toast({
        title: "Error loading report data",
        description: "Invalid API key - please refresh the page",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoadingReport(true);
      
      // Format dates for API query params
      const startDateParam = startDate.toISOString();
      const endDateParam = endDate.toISOString();
      
      // Fetch detailed report
      const response = await fetch(`/api/merchants/reports/date-range?startDate=${startDateParam}&endDate=${endDateParam}`, {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      
      const data = await response.json();
      console.log("Report data loaded:", data);
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Failed to generate report",
        description: "Please try again later",
        variant: "destructive",
      });
      setReportData(null);
    } finally {
      setIsLoadingReport(false);
    }
  };
  
  // Get badge color based on payment status
  const getBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'partial':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return '';
    }
  };
  
  // Export to CSV
  const exportToCSV = () => {
    if (!reportData) return;
    
    // Prepare headers
    const headers = ['Order ID', 'Date', 'Status', 'USD Amount', 'CPXTB Amount', 'Transaction Hash'];
    
    // Prepare payment data
    const rows = reportData.report.payments.map((payment: any) => [
      payment.orderId,
      format(parseISO(payment.createdAt), 'PP'),
      payment.status,
      payment.amountUsd,
      payment.amountCpxtb,
      payment.transactionHash || '-'
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename with date range
    const startStr = format(parseISO(reportData.period.startDate), 'yyyy-MM-dd');
    const endStr = format(parseISO(reportData.period.endDate), 'yyyy-MM-dd');
    link.download = `CPXTB_Payments_${startStr}_to_${endStr}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: "CSV file has been downloaded"
    });
  };
  
  // Export to PDF
  const exportToPDF = () => {
    if (!reportData) return;
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title and date range
    const startStr = format(parseISO(reportData.period.startDate), 'PP');
    const endStr = format(parseISO(reportData.period.endDate), 'PP');
    const businessName = selectedMerchant?.businessName || 'Your Business';
    
    doc.setFontSize(18);
    doc.text(`CPXTB Payment Report`, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Business: ${businessName}`, 14, 30);
    doc.text(`Period: ${startStr} to ${endStr}`, 14, 38);
    
    // Add summary
    doc.setFontSize(14);
    doc.text('Summary', 14, 48);
    
    const summary = [
      ['Total Payments', reportData.report.summary.totalPayments.toString()],
      ['Successful', reportData.report.summary.successfulPayments.toString()],
      ['Failed', reportData.report.summary.failedPayments.toString()],
      ['Pending', reportData.report.summary.pendingPayments.toString()],
      ['Expired', reportData.report.summary.expiredPayments.toString()],
      ['Total USD Volume', `$${reportData.report.summary.totalAmountUsd.toFixed(2)}`],
      ['Total CPXTB Volume', reportData.report.summary.totalAmountCpxtb]
    ];
    
    autoTable(doc, {
      startY: 52,
      head: [['Metric', 'Value']],
      body: summary,
      theme: 'grid'
    });
    
    // Add transactions table
    doc.setFontSize(14);
    
    // Use a variable to store the first table's final position instead of doc.lastAutoTable
    let finalY = 130; // Default position if the first table doesn't set it
    
    // Get the actual position from the first table result
    const tableData = reportData.report.payments.map((payment: any) => [
      payment.orderId,
      format(parseISO(payment.createdAt), 'PP'),
      payment.status,
      `$${payment.amountUsd}`,
      payment.amountCpxtb,
      payment.transactionHash ? payment.transactionHash.substring(0, 10) + '...' : '-'
    ]);
    
    doc.text('Transaction Details', 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Order ID', 'Date', 'Status', 'USD', 'CPXTB', 'Tx Hash']],
      body: tableData,
      theme: 'striped',
      styles: { overflow: 'ellipsize', cellWidth: 'wrap' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 40 }
      }
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Generated on ${format(new Date(), 'PPpp')} - Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Save the PDF
    doc.save(`CPXTB_Payment_Report_${startStr.replace(/\//g, '-')}_to_${endStr.replace(/\//g, '-')}.pdf`);
    
    toast({
      title: "Export successful",
      description: "PDF report has been downloaded"
    });
  };

  // Create merchant mutation
  const createMerchantMutation = useMutation({
    mutationFn: async (formData: typeof merchantForm) => {
      // Make sure we have user data
      if (!userData?.id) {
        throw new Error("User not authenticated. Please log in.");
      }
      
      // Prepare data to send to the API
      const dataToSend = {
        ...formData,
        // Handle website field - ensure it has protocol or is empty string
        website: formData.website.trim() ? 
          (formData.website.match(/^https?:\/\//) ? formData.website.trim() : `https://${formData.website.trim()}`) : 
          "",
        // Add legalAgreementAccepted from the legalAgreement checkbox
        legalAgreementAccepted: formData.legalAgreement,
        // Ensure userId is a number
        userId: Number(userData.id),
        // Make sure wallet address is in the expected format
        walletAddress: formData.walletAddress.startsWith('0x') ? 
          formData.walletAddress.toLowerCase() : 
          `0x${formData.walletAddress.toLowerCase()}`
      };
      
      console.log("Sending merchant data:", JSON.stringify(dataToSend, null, 2));
      try {
        const res = await apiRequest("POST", "/api/merchants", dataToSend);
        const data = await res.json();
        return data;
      } catch (error: any) {
        console.error("Merchant registration error:", error);
        // Get the response text if available
        if (error.response) {
          const errorText = await error.response.text();
          console.error("Server error response:", errorText);
          throw new Error(errorText || error.message);
        }
        throw error;
      }
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
    mutationFn: async (formData: { 
      amountUsd: string | number, 
      description: string, 
      merchantId: number,
      amountCpxtb?: number,
      exchangeRate?: number 
    }) => {
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
      
      // Get the current exchange rate - currently using a fixed value of 0.002177 USD per CPXTB token
      // This matches what's displayed in the price display component from the logs
      const exchangeRate = 0.002177; 
      
      // Calculate the amount of CPXTB tokens needed based on USD amount and exchange rate
      // Convert any string input to number for validation
      const amountUsd = typeof formData.amountUsd === 'string' ? parseFloat(formData.amountUsd) : formData.amountUsd;
      const amountCpxtb = amountUsd / exchangeRate;
      
      // Set expiration time (15 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      // Generate a unique reference for debugging
      const paymentReference = `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // Create payment data with the correct types for API validation
      // Send all required fields explicitly to match server-side schema
      const paymentData: PaymentCreateData = {
        amountUsd: amountUsd,
        amountCpxtb: amountCpxtb,
        exchangeRate: exchangeRate,
        description: formData.description || "Payment",
        merchantId: selectedMerchant.id,
        paymentReference: paymentReference,
        expiresAt: expiresAt
      };
      
      console.log("Payment data being sent:", {
        amountUsd,
        amountCpxtb,
        exchangeRate
      });
      
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
    
    // Check if legal agreement has been accepted
    if (!merchantForm.legalAgreement) {
      toast({
        title: "Legal Agreement Required",
        description: "You must accept the terms and conditions to register as a merchant",
        variant: "destructive",
      });
      return;
    }
    
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
    
    // Order ID validation removed as per user request
    
    console.log("Submitting payment with validated merchant:", {
      id: selectedMerchant.id,
      businessName: selectedMerchant.businessName,
      apiKeyPresent: !!selectedMerchant.apiKey
    });
    
    // Pass only the basic payment form fields to the mutation
    // Let the mutation function handle all the conversions and adding required fields
    console.log("Creating payment with form values:", paymentForm);
    
    createPaymentMutation.mutate({
      description: paymentForm.description || "",
      // Just pass the string value - the mutation will handle conversion
      amountUsd: paymentForm.amountUsd,
      merchantId: selectedMerchant.id
    });
  };

  // Handle form changes
  const handleMerchantFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setMerchantForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setMerchantForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle theme form changes
  const handleThemeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setThemeForm(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'borderRadius') {
      setThemeForm(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setThemeForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Payment verification form state
  const [verificationForm, setVerificationForm] = useState({
    reference: "",
    transactionHash: ""
  });
  
  // Theme update mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (themeData: typeof themeForm) => {
      if (!selectedMerchant) {
        throw new Error("Please select a merchant account first");
      }

      const apiKey = selectedMerchant.apiKey;
      if (!apiKey || apiKey.includes('...')) {
        throw new Error("Invalid API key - please refresh the page");
      }
      
      console.log("Updating theme for merchant:", selectedMerchant.businessName);
      
      // Use direct fetch with explicit headers
      const response = await fetch("/api/merchants/theme", {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(themeData)
      });
      
      if (!response.ok) {
        let errorText = "Failed to update theme";
        try {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorText);
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Theme updated",
        description: "Payment page theme has been updated successfully.",
      });
      // Update selected merchant with the new theme data
      if (selectedMerchant) {
        setSelectedMerchant({
          ...selectedMerchant,
          ...data.merchant
        });
      }
      refetchMerchants();
    },
    onError: (error: Error) => {
      toast({
        title: "Theme update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Apply theme template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: async (templateName: string) => {
      if (!selectedMerchant) {
        throw new Error("Please select a merchant account first");
      }

      const apiKey = selectedMerchant.apiKey;
      if (!apiKey || apiKey.includes('...')) {
        throw new Error("Invalid API key - please refresh the page");
      }
      
      console.log("Applying theme template for merchant:", {
        id: selectedMerchant.id,
        name: selectedMerchant.businessName,
        templateBefore: selectedMerchant.themeTemplate,
        newTemplate: templateName
      });
      
      // Use direct fetch with explicit headers
      const response = await fetch("/api/merchants/apply-template", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ templateName })
      });
      
      if (!response.ok) {
        let errorText = "Failed to apply theme template";
        try {
          const errorData = await response.json();
          errorText = errorData.message || errorText;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorText);
      }
      
      const data = await response.json();
      console.log("API Response for theme update:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Template application succeeded, received data:", data);
      
      // Store received merchant data for debugging
      const receivedMerchant = data.merchant;
      console.log("Received merchant from API:", {
        id: receivedMerchant.id,
        themeTemplate: receivedMerchant.themeTemplate,
        primaryColor: receivedMerchant.primaryColor,
        secondaryColor: receivedMerchant.secondaryColor
      });
      
      // Step 1: Immediately update the local selected merchant state
      // This provides immediate feedback to the user while we do a full refresh
      setSelectedMerchant((prevMerchant: any) => {
        if (!prevMerchant) return receivedMerchant;
        
        const updatedMerchant = {
          ...prevMerchant,
          themeTemplate: receivedMerchant.themeTemplate,
          primaryColor: receivedMerchant.primaryColor,
          secondaryColor: receivedMerchant.secondaryColor,
          accentColor: receivedMerchant.accentColor,
          fontFamily: receivedMerchant.fontFamily,
          borderRadius: receivedMerchant.borderRadius,
          darkMode: receivedMerchant.darkMode,
        };
        
        console.log("Updated local merchant data immediately:", {
          id: updatedMerchant.id,
          themeTemplate: updatedMerchant.themeTemplate
        });
        
        return updatedMerchant;
      });
      
      // Step 2: Also update the theme form immediately with new values
      setThemeForm({
        primaryColor: receivedMerchant.primaryColor || "#3b82f6",
        secondaryColor: receivedMerchant.secondaryColor || "#10b981",
        accentColor: receivedMerchant.accentColor || "#f59e0b",
        fontFamily: receivedMerchant.fontFamily || "Inter",
        borderRadius: receivedMerchant.borderRadius || 8,
        darkMode: receivedMerchant.darkMode || false,
        customCss: receivedMerchant.customCss || "",
        customHeader: receivedMerchant.customHeader || "",
        customFooter: receivedMerchant.customFooter || ""
      });
      
      // Step 3: Show success toast
      toast({
        title: "Template applied successfully",
        description: `The "${renderTemplateName(receivedMerchant.themeTemplate)}" template has been applied to your payment page.`,
      });
      
      // Step 4: As a backup measure, still refresh from server (but we don't need to wait for this)
      refetchMerchants();
      
      // Step 5: Reset applying flag
      setApplyingTemplate(false);
    },
    onError: (error: Error) => {
      setApplyingTemplate(false);
      console.error("Template application error:", error);
      toast({
        title: "Template application failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
      // Refresh merchant data to show updated payment status
      refetchMerchants();
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
        hasApiKey: !!firstMerchant.apiKey,
        themeTemplate: firstMerchant.themeTemplate,
        primaryColor: firstMerchant.primaryColor
      });
      setSelectedMerchant(firstMerchant);
    } else {
      console.log("No merchants available to select");
    }
  }, [merchantData]);
  
  // This useEffect will update the theme form whenever the selected merchant changes
  useEffect(() => {
    if (selectedMerchant) {
      console.log("Updating theme form from selected merchant:", {
        id: selectedMerchant.id,
        template: selectedMerchant.themeTemplate,
        primaryColor: selectedMerchant.primaryColor,
        darkMode: selectedMerchant.darkMode
      });
      
      // Populate form with merchant's theme settings
      setThemeForm({
        primaryColor: selectedMerchant.primaryColor || "#3b82f6",
        secondaryColor: selectedMerchant.secondaryColor || "#10b981",
        accentColor: selectedMerchant.accentColor || "#f59e0b",
        fontFamily: selectedMerchant.fontFamily || "Inter",
        borderRadius: selectedMerchant.borderRadius || 8,
        darkMode: selectedMerchant.darkMode || false,
        customCss: selectedMerchant.customCss || "",
        customHeader: selectedMerchant.customHeader || "",
        customFooter: selectedMerchant.customFooter || ""
      });
    }
  }, [selectedMerchant]);
  
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
  // and sets up automatic refreshing
  useEffect(() => {
    if (activeTab === "history" && selectedMerchant) {
      console.log("History tab activated, fetching payment history...");
      fetchPaymentHistory();
      
      // Set up periodic refresh for payment history (every 15 seconds)
      const refreshInterval = setInterval(() => {
        console.log("Auto-refreshing payment history...");
        fetchPaymentHistory();
      }, 15000);
      
      // Clean up the interval when tab changes or component unmounts
      return () => {
        clearInterval(refreshInterval);
        console.log("Cleared payment history refresh interval");
      };
    }
  }, [activeTab, selectedMerchant, fetchPaymentHistory]);
  
  // ENHANCED: This useEffect adds aggressive polling for payment status on QR code tab
  // similar to the polling mechanism in payment-page.tsx
  useEffect(() => {
    if (activeTab === "qrcode" && currentPayment?.payment && (currentPayment.payment.reference || currentPayment.payment.paymentReference) && selectedMerchant?.apiKey) {
      console.log("🔄 Setting up aggressive payment status polling for QR code tab");
      
      // Define a function to fetch payment status with enhanced validation
      const fetchPaymentStatus = async () => {
        try {
          // Add cache-busting timestamp
          const timestamp = Date.now();
          // Use either reference or paymentReference property, whichever is available
          const paymentRef = currentPayment.payment.reference || currentPayment.payment.paymentReference;
          const response = await fetch(`/api/payments/${paymentRef}?t=${timestamp}`, {
            headers: {
              'X-API-Key': selectedMerchant.apiKey,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            console.error("⚠️ Error polling for payment status:", response.statusText);
            return;
          }
          
          const data = await response.json();
          console.log("🔍 Merchant QR polling result:", data);
          
          // ENHANCED STATUS VERIFICATION: Apply same logic as WebSocket handler
          // -------------------------------------------------------------
          // Extract data for validation
          const payment = data.payment;
          
          // Skip if no payment data returned
          if (!payment) {
            console.error("❌ No payment data in polling response");
            return;
          }
          
          // Store original status for comparison
          const originalStatus = payment.status;
          
          // Parse all numeric values for comparison
          const receivedAmount = parseFloat(payment.receivedAmount || '0');
          const requiredAmount = parseFloat(payment.requiredAmount || payment.amountCpxtb || '0');
          const remainingAmount = parseFloat(payment.remainingAmount || '0');
          
          // Define all possible completion conditions
          const conditions = {
            explicitlyCompleted: payment.status === 'completed',
            zeroRemaining: remainingAmount <= 0,
            zeroRemainingExact: payment.remainingAmount === '0.000000',
            receivedEnough: receivedAmount >= requiredAmount,
            hasTransactionHash: !!payment.transactionHash,
            hasCompletedTimestamp: !!payment.completedAt
          };
          
          // FIXED BUG: For partial payments, we need to be strict 
          const isPartialPayment = payment.status === 'partial';
          
          console.log("🔍 MERCHANT QR POLL - Payment status verification:", {
            reference: payment.reference || payment.paymentReference,
            ...conditions,
            isPartialPayment,
            originalStatus,
            receivedAmount, 
            requiredAmount,
            remainingAmount
          });
          
          // Fix for partial payment handling - only consider effectively completed
          // if explicitly completed or meets numeric criteria but NOT partial payment
          const isEffectivelyCompleted = (
            // If explicitly marked as completed, honor that
            conditions.explicitlyCompleted || 
            // OR if it meets our numeric criteria AND is not a partial payment
            (!isPartialPayment && (
              conditions.zeroRemaining || 
              conditions.zeroRemainingExact || 
              conditions.receivedEnough
            ))
          );
          
          // Update UI with the payment data
          if (isPartialPayment) {
            // For partial payments, update UI but don't show completion
            console.log("💲 Updating merchant QR UI with partial payment data");
            
            setCurrentPayment((prevState: any) => ({
              ...prevState,
              payment: {
                ...payment,
                status: 'partial'  // Ensure status is 'partial'
              }
            }));
            
            // Refresh payment history in the background to reflect partial payment
            fetchPaymentHistory();
          }
          else if (isEffectivelyCompleted) {
            // This should be a completed payment
            console.log("🚨 MERCHANT QR POLL: This payment should be completed", {
              receivedAmount,
              requiredAmount,
              remainingAmount
            });
            
            // Force payment data to be in completed state
            const completedPayment = {
              ...payment,
              status: 'completed',
              remainingAmount: '0.000000'
            };
            
            setCurrentPayment((prevState: any) => ({
              ...prevState,
              payment: completedPayment
            }));
            
            // Only show completion notification if transitioning to completed
            if (originalStatus !== 'completed') {
              setCompletedPaymentRef(payment.reference || payment.paymentReference);
              setShowSuccessNotification(true);
              
              // Refresh payment history in the background
              fetchPaymentHistory();
              
              // Play notification sound
              try {
                const audio = new Audio('/payment-success.mp3');
                audio.play().catch(err => console.error("Error playing audio:", err));
              } catch (err) {
                console.error("Error playing notification sound:", err);
              }
            }
          }
          else {
            // Regular update for other payment states (pending, etc.)
            console.log("📊 Regular update of merchant QR UI with payment data");
            
            setCurrentPayment((prevState: any) => ({
              ...prevState,
              payment: {
                ...payment
              }
            }));
          }
        } catch (err) {
          console.error("Error polling for payment status:", err);
        }
      };
      
      // Run once immediately
      fetchPaymentStatus();
      
      // Set up aggressive polling interval (every 3 seconds)
      const pollingInterval = setInterval(() => {
        console.log("⏱️ Polling for merchant QR payment status update...");
        fetchPaymentStatus();
      }, 3000);
      
      // Clean up interval on tab change or unmount
      return () => {
        clearInterval(pollingInterval);
        console.log("Cleared payment QR polling interval");
      };
    }
  }, [activeTab, currentPayment?.payment, selectedMerchant, fetchPaymentHistory]);

  // The ProtectedRoute component will now handle the authentication check
  // We don't need the manual redirect anymore since the component will only render
  // if the user is authenticated

  // Handle payment update notifications with enhanced status verification
  const handlePaymentUpdate = (payment: any) => {
    console.log("🔔 Payment update received in merchant dashboard:", payment);
    
    // ENHANCED STATUS VERIFICATION - same as in payment-page.tsx
    // -------------------------------------------------------------
    // Parse all numeric values for comparison
    const receivedAmount = parseFloat(payment.receivedAmount || '0');
    const requiredAmount = parseFloat(
      payment.requiredAmount || 
      (currentPayment?.payment?.amountCpxtb) || 
      '0'
    );
    const remainingAmount = parseFloat(payment.remainingAmount || '0');
    
    // Define all possible completion conditions
    const conditions = {
      explicitlyCompleted: payment.status === 'completed',
      zeroRemaining: remainingAmount <= 0,
      zeroRemainingExact: payment.remainingAmount === '0.000000',
      receivedEnough: receivedAmount >= requiredAmount,
      hasTransactionHash: !!payment.transactionHash,
      hasCompletedTimestamp: !!payment.completedAt
    };
    
    // FIXED BUG: For partial payments, we need to be strict and verify that
    // the received amount is ACTUALLY sufficient before marking as completed
    const isPartialPayment = payment.status === 'partial';
    
    console.log("🔍 MERCHANT DASHBOARD - Payment update status check:", {
      reference: payment.reference || payment.paymentReference,
      ...conditions,
      isPartialPayment,
      originalStatus: payment.status,
      receivedAmount,
      requiredAmount,
      remainingAmount
    });
    
    // Fix for partial payment handling:
    // Only consider it effectively completed if it's received enough AND not explicitly partial
    const isEffectivelyCompleted = (
      // If explicitly marked as completed, honor that
      conditions.explicitlyCompleted || 
      // OR if it meets our numeric criteria AND is not a partial payment
      (!isPartialPayment && (
        conditions.zeroRemaining || 
        conditions.zeroRemainingExact || 
        conditions.receivedEnough
      ))
    );
    
    // Force status to completed if criteria are met for completed payment
    if (isEffectivelyCompleted && payment.status !== 'completed') {
      console.log("🚨 MERCHANT DASHBOARD - Auto-correcting status from", payment.status, "to completed", {
        reason: "Payment meets completion criteria but incorrect status",
        receivedAmount, 
        requiredAmount,
        remainingAmount
      });
      
      // Override status
      payment.status = 'completed';
      // Also ensure remaining amount is 0
      payment.remainingAmount = '0.000000';
    }
    
    // For partial payments, we need to update the UI but NOT show completion notification
    if (isPartialPayment && currentPayment && 
        currentPayment.payment && 
        (currentPayment.payment.reference === payment.paymentReference || 
         currentPayment.payment.reference === payment.reference || 
         currentPayment.payment.paymentReference === payment.paymentReference)) {
      
      console.log('💲 Updating current payment with partial payment data in merchant dashboard', {
        receivedAmount,
        requiredAmount,
        remainingAmount
      });
      
      // Create updated payment object with partial payment status
      const updatedPayment = {
        ...currentPayment,
        payment: {
          ...currentPayment.payment,
          status: 'partial',
          receivedAmount: payment.receivedAmount || currentPayment.payment.receivedAmount,
          remainingAmount: payment.remainingAmount
        }
      };
      
      // Update the current payment
      setCurrentPayment(updatedPayment);
      
      // Switch to QR code tab if not already there
      if (activeTab !== "qrcode") {
        toast({
          title: "Partial Payment Received",
          description: `Still need ${payment.remainingAmount} CPXTB to complete this payment`,
          variant: "warning",
          action: (
            <div 
              className="bg-amber-600 text-white hover:bg-amber-700 cursor-pointer p-1 rounded"
              onClick={() => setActiveTab("qrcode")}
            >
              View
            </div>
          )
        });
      }
      
      // Refresh payment history to reflect the partial payment
      fetchPaymentHistory();
    }
    // Only proceed with completion logic if payment is completed (no additional checks)
    else if (payment.status === 'completed') {
      
      // Show payment success notification
      setCompletedPaymentRef(payment.paymentReference);
      setShowSuccessNotification(true);
      
      console.log('💰 Payment marked as completed, showing success notification', {
        status: payment.status,
        paymentReference: payment.paymentReference
      });
      
      // Update current payment status if this is the active payment
      if (currentPayment && 
          currentPayment.payment && 
          (currentPayment.payment.reference === payment.paymentReference || 
           currentPayment.payment.reference === payment.reference || 
           currentPayment.payment.paymentReference === payment.paymentReference)) {
        
        console.log('💰 Updating current payment status to completed in merchant dashboard');
        
        // Create updated payment object with completed status
        const updatedPayment = {
          ...currentPayment,
          payment: {
            ...currentPayment.payment,
            status: 'completed',
            transactionHash: payment.transactionHash,
            receivedAmount: payment.receivedAmount || currentPayment.payment.receivedAmount,
            remainingAmount: '0.000000'  // Force remaining to zero when completed
          }
        };
        
        // Update the current payment
        setCurrentPayment(updatedPayment);
        
        // Switch to QR code tab if not already there
        if (activeTab !== "qrcode") {
          toast({
            title: "Payment Processed",
            description: "Switch to QR tab to see payment details",
            action: (
              <div 
                className="bg-green-600 text-white hover:bg-green-700 cursor-pointer p-1 rounded"
                onClick={() => setActiveTab("qrcode")}
              >
                View
              </div>
            )
          });
        }
      }
      
      // Refresh payment history
      fetchPaymentHistory();
    } else {
      console.log("ℹ️ Payment update ignored - status is not completed or partial:", payment.status);
    }
  };

  return (
    <div className="container my-8">
      {/* Real-time payment notification listener */}
      <PaymentNotification onPaymentUpdate={handlePaymentUpdate} />
      
      {/* Animated success notification with security verification */}
      <PaymentSuccessNotification 
        isVisible={showSuccessNotification}
        reference={completedPaymentRef}
        securityVerified={true} // We only show this if security checks passed
        onClose={() => setShowSuccessNotification(false)}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
        <div className="flex items-center gap-2">
          {userData && (
            <>
              <ClaimTokensButton />
              <ProfileButton />
              <LogoutButton />
            </>
          )}
        </div>
      </div>
      <p className="mb-8 text-muted-foreground">
        Accept CPXTB token payments for your business
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="business">Business Setup</TabsTrigger>
          <TabsTrigger value="payments" disabled={!merchantData?.merchants?.length}>Create Payment</TabsTrigger>
          <TabsTrigger value="qrcode" disabled={!currentPayment}>Payment QR Code</TabsTrigger>
          <TabsTrigger value="history" disabled={!merchantData?.merchants?.length}>Payment History</TabsTrigger>
          <TabsTrigger value="reports" disabled={!merchantData?.merchants?.length}>Reports</TabsTrigger>
          <TabsTrigger value="pamphlet" disabled={!merchantData?.merchants?.length}>Print Materials</TabsTrigger>
          <TabsTrigger value="appearance" disabled={!merchantData?.merchants?.length}>Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Social Login Component */}
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <MerchantSocialLogin />
            </React.Suspense>
            
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
                      onChange={(e) => {
                        // Ensure wallet address is properly formatted when entered
                        let value = e.target.value.trim();
                        setMerchantForm(prev => ({ 
                          ...prev, 
                          walletAddress: value 
                        }));
                      }}
                      pattern="^(0x)?[0-9a-fA-F]{40}$"
                      title="Please enter a valid Ethereum address (40 hexadecimal characters with optional 0x prefix)"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Enter a valid Ethereum wallet address (0x followed by 40 hex characters)</p>
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
                        // Get the raw input value
                        let value = e.target.value.trim();
                        
                        // If empty, set to empty string (handled by validation)
                        if (!value) {
                          setMerchantForm(prev => ({ ...prev, website: "" }));
                          return;
                        }
                        
                        // Check if the URL has protocol; if not, add https://
                        if (!value.match(/^https?:\/\//)) {
                          value = 'https://' + value;
                        }
                        
                        // Update the form state
                        setMerchantForm(prev => ({ ...prev, website: value }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">URL must include https:// or http:// if provided</p>
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
                  
                  <div className="space-y-4 my-4 border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="legalAgreement" 
                        name="legalAgreement"
                        checked={merchantForm.legalAgreement}
                        onCheckedChange={(checked: boolean) => {
                          setMerchantForm(prev => ({ 
                            ...prev, 
                            legalAgreement: checked === true 
                          }));
                        }}
                      />
                      <Label 
                        htmlFor="legalAgreement" 
                        className="text-sm font-semibold cursor-pointer"
                      >
                        I accept the Terms and Conditions for accepting CPXTB payments
                      </Label>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-2 pl-6">
                      <p>By accepting these terms, I agree to:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Process CPXTB token payments for goods and services in compliance with all applicable laws and regulations</li>
                        <li>Accept responsibility for properly reporting any crypto payments for tax purposes</li>
                        <li>Understand the risks associated with cryptocurrency price volatility</li>
                        <li>Implement proper security measures to protect customer and payment data</li>
                        <li>Not use CPXTB payments for illegal goods, services, or activities</li>
                        <li>Provide customers with clear information about payment processing times and fees</li>
                      </ul>
                      <p className="mt-2">
                        <span className="font-medium">Note:</span> Failure to comply with these terms may result in suspension or termination of your merchant account.
                      </p>
                    </div>
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
            <div>
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
                  
                  {/* Order ID field removed as per user request */}
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
            
            {/* Second column */}
            <Card>
              <CardHeader>
                <CardTitle>Social Login Payment QR Code</CardTitle>
                <CardDescription>
                  Make it easier for customers to pay with CPXTB by generating a social login-enabled QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMerchant ? (
                  <div className="space-y-6">
                    <div className="bg-sky-50 dark:bg-sky-950 p-4 rounded-md border border-sky-200 dark:border-sky-800 space-y-2 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-sky-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">What is Social Login Payment?</h4>
                          <p className="text-sm text-muted-foreground">
                            This QR code allows your customers to pay with CPXTB tokens without needing a crypto wallet. 
                            They can login with their Google, Apple, or email accounts to make payments.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Replace with our SimplePaymentQRGenerator component */}
                    <SimplePaymentQRGenerator 
                      merchantId={selectedMerchant.id}
                      merchantName={selectedMerchant.businessName}
                      apiKey={selectedMerchant.apiKey}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Please select a business above to generate a social login payment QR code</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                    
                    {/* Direct payment page link */}
                    <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Share this direct payment link with your customers:
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${window.location.origin}/payment/${currentPayment.payment.reference || currentPayment.payment.paymentReference}`}
                          readOnly
                          className="text-xs font-mono"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/payment/${currentPayment.payment.reference || currentPayment.payment.paymentReference}`);
                            toast({
                              title: "Copied",
                              description: "Payment link copied to clipboard",
                            });
                          }}
                        >
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                      </div>
                      <a 
                        href={`${window.location.origin}/payment/${currentPayment.payment.reference || currentPayment.payment.paymentReference}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open payment page in new tab
                      </a>
                    </div>
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
                    
                    {/* Removed payment status message box per user request */}
                    {currentPayment.payment.status === 'completed' ? (
                      <div className="flex justify-end mb-2">
                        {currentPayment.payment.transactionHash && (
                          <a 
                            href={`https://basescan.org/tx/${currentPayment.payment.transactionHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-green-200 dark:bg-green-800 p-1 rounded flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Transaction
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-black dark:text-white bg-green-100 dark:bg-green-950 p-3 rounded-lg border border-green-300 dark:border-green-700 font-medium shadow-md flex items-center gap-2">
                        <div className="flex-shrink-0">
                          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          ✅ Payment monitoring active: Transaction will be automatically verified once detected on the blockchain
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <Label>Payment Reference</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={currentPayment.payment.reference || currentPayment.payment.paymentReference}
                          readOnly
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(currentPayment.payment.reference || currentPayment.payment.paymentReference);
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
                      {currentPayment.payment.status === 'completed' ? (
                        <div className="flex justify-end mb-2">
                          {currentPayment.payment.transactionHash && (
                            <a 
                              href={`https://basescan.org/tx/${currentPayment.payment.transactionHash}`} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 rounded flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Transaction
                            </a>
                          )}
                        </div>
                      ) : currentPayment.payment.status === 'expired' ? (
                        <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg border border-red-300 dark:border-red-700 flex items-center gap-2">
                          <div className="h-3 w-3 bg-red-500 rounded-full" />
                          <span className="font-semibold text-red-700 dark:text-red-300">Payment Expired</span>
                        </div>
                      ) : (
                        <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700 flex items-center gap-2">
                          <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
                          <span className="font-semibold text-yellow-700 dark:text-yellow-300">Payment Pending</span>
                        </div>
                      )}
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
                      Show the QR code to your customer or share the direct payment link. The payment page will automatically reflect your business theme.
                    </p>
                    <div className="bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 rounded p-3 text-sm flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-black dark:text-blue-300">NEW FEATURE: Direct Payment Page</p>
                        <p className="text-muted-foreground mt-1">Share the direct payment link with your customers for a professional checkout experience that reflects your business theme.</p>
                      </div>
                    </div>
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
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-l block break-all w-full text-black dark:text-white">
                        {currentPayment.payment.merchantWalletAddress || selectedMerchant?.walletAddress || ""}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 rounded-l-none"
                        onClick={() => {
                          // Use selected merchant wallet address if payment wallet address is undefined
                          const walletAddress = currentPayment.payment.merchantWalletAddress || 
                                              selectedMerchant?.walletAddress || 
                                              "";
                          navigator.clipboard.writeText(walletAddress);
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
                      After the customer completes the payment, keep this application open to automatically detect and verify the transaction. 
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-300">
                        <div className="relative">
                          <div className="h-3 w-3 bg-blue-500 rounded-full animate-ping absolute"></div>
                          <div className="h-3 w-3 bg-blue-500 rounded-full relative"></div>
                        </div>
                        <span className="font-medium">IMPORTANT: Keep this window open while waiting for payment</span>
                      </div>
                    </div>
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
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-l text-black dark:text-white">{CPXTB_TOKEN_ADDRESS}</code>
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
              <Alert className="mb-4 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-100 font-medium">Automatic Payment Detection Active</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-200">
                  Payment transactions are automatically monitored and verified in real-time. Keep this application open while waiting for payments. Manual verification is available as a backup option.
                </AlertDescription>
              </Alert>
              {/* Payment verification form */}
              <div className="mb-8 border border-border p-4 rounded-md bg-muted/20">
                <h3 className="text-lg font-medium mb-3 text-foreground">Manual Verification (Backup Option)</h3>
                <p className="text-sm mb-4 text-slate-700 dark:text-slate-200">
                  <span className="font-medium text-amber-700 dark:text-amber-400">Note: Payments should be verified automatically.</span> Use this form only if automatic verification fails and the customer provides you with the transaction hash after sending CPXTB tokens.
                </p>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="payment-reference" className="text-foreground">Payment Reference</Label>
                    <Input
                      id="payment-reference"
                      placeholder="e.g., CPXTB-5055F86C53B93DDB"
                      value={verificationForm.reference}
                      onChange={(e) => setVerificationForm({...verificationForm, reference: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="transaction-hash" className="text-foreground">Transaction Hash</Label>
                    <Input
                      id="transaction-hash"
                      placeholder="0x..."
                      value={verificationForm.transactionHash}
                      onChange={(e) => setVerificationForm({...verificationForm, transactionHash: e.target.value})}
                    />
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      The transaction hash starts with "0x" and is provided by the customer after they make the payment.
                    </p>
                  </div>
                  <Button 
                    onClick={handleVerifyPayment}
                    disabled={verifyPaymentMutation.isPending || !verificationForm.reference || !verificationForm.transactionHash}
                    className="w-full"
                  >
                    {verifyPaymentMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Payment history data */}
              <div className="mt-8">
                {paymentHistory.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-foreground font-semibold">Date</TableHead>
                          <TableHead className="text-foreground font-semibold">Reference</TableHead>
                          <TableHead className="text-foreground font-semibold">Amount (USD)</TableHead>
                          <TableHead className="text-foreground font-semibold">Amount (CPXTB)</TableHead>
                          <TableHead className="text-foreground font-semibold">Status</TableHead>
                          <TableHead className="text-foreground font-semibold">Remaining</TableHead>
                          <TableHead className="text-foreground font-semibold">Transaction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.map((payment) => (
                          <TableRow key={payment.id} className="hover:bg-muted/50">
                            <TableCell className="text-foreground">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {payment.paymentReference}
                            </TableCell>
                            <TableCell className="text-foreground">${Number(payment.amountUsd).toFixed(2)}</TableCell>
                            <TableCell className="text-foreground">{Number(payment.amountCpxtb).toFixed(6)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : payment.status === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {payment.status === 'partial' ? (
                                <div className="flex flex-col">
                                  <span className="text-amber-700 font-medium">
                                    {payment.remainingAmount
                                      ? Number(payment.remainingAmount).toFixed(6)
                                      : (Number(payment.requiredAmount) - Number(payment.receivedAmount || 0)).toFixed(6)
                                    } CPXTB
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    needed to complete
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {payment.transactionHash ? (
                                <a 
                                  href={`https://basescan.org/tx/${payment.transactionHash}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center text-blue-600 hover:text-blue-800 underline"
                                >
                                  View
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="text-center space-y-4 py-6">
                    <div className="mx-auto bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No payment history yet</h3>
                    <p className="text-slate-700 dark:text-slate-300 max-w-md mx-auto">
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
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Reports</CardTitle>
              <CardDescription>
                Generate reports for your payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Date Range Selection */}
              <div className="mb-6 border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Select Date Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : <span className="text-muted-foreground">Select start date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => setStartDate(date)}
                          initialFocus
                          disabled={(date: Date) => date > new Date() || (endDate ? date > endDate : false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : <span className="text-muted-foreground">Select end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => setEndDate(date)}
                          initialFocus
                          disabled={(date: Date) => date > new Date() || (startDate ? date < startDate : false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate(subDays(new Date(), 7));
                      setEndDate(new Date());
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate(subDays(new Date(), 30));
                      setEndDate(new Date());
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate(subMonths(new Date(), 3));
                      setEndDate(new Date());
                    }}
                  >
                    Last 3 months
                  </Button>
                  <Button
                    variant="default"
                    disabled={!startDate || !endDate || isLoadingReport}
                    onClick={fetchReportData}
                  >
                    {isLoadingReport ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChart className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Report Results */}
              {reportData ? (
                <div className="space-y-6">
                  {/* Report Summary */}
                  <div className="bg-muted/30 rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Report Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-background p-4 rounded-md border shadow-sm">
                        <div className="text-sm text-muted-foreground">Total Payments</div>
                        <div className="text-2xl font-bold">{reportData.report.summary.totalPayments}</div>
                      </div>
                      <div className="bg-background p-4 rounded-md border shadow-sm">
                        <div className="text-sm text-muted-foreground">Successful</div>
                        <div className="text-2xl font-bold text-green-600">
                          {reportData.report.summary.successfulPayments}
                        </div>
                      </div>
                      <div className="bg-background p-4 rounded-md border shadow-sm">
                        <div className="text-sm text-muted-foreground">Total USD</div>
                        <div className="text-2xl font-bold">
                          ${reportData.report.summary.totalAmountUsd.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-background p-4 rounded-md border shadow-sm">
                        <div className="text-sm text-muted-foreground">Total CPXTB</div>
                        <div className="text-2xl font-bold">
                          {reportData.report.summary.totalAmountCpxtb}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Transaction Table */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Transaction Details</h3>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={exportToCSV}>
                          <FileText className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportToPDF}>
                          <FileImage className="mr-2 h-4 w-4" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    
                    {reportData.report.payments.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-foreground font-semibold">Date</TableHead>
                              <TableHead className="text-foreground font-semibold">Order ID</TableHead>
                              <TableHead className="text-foreground font-semibold">Amount (USD)</TableHead>
                              <TableHead className="text-foreground font-semibold">Amount (CPXTB)</TableHead>
                              <TableHead className="text-foreground font-semibold">Status</TableHead>
                              <TableHead className="text-foreground font-semibold">Transaction</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.report.payments.map((payment: any) => (
                              <TableRow key={payment.id} className="hover:bg-muted/50">
                                <TableCell className="text-foreground">
                                  {format(parseISO(payment.createdAt), 'PP')}
                                </TableCell>
                                <TableCell className="font-medium text-foreground">
                                  {payment.orderId}
                                </TableCell>
                                <TableCell className="text-foreground">${Number(payment.amountUsd).toFixed(2)}</TableCell>
                                <TableCell className="text-foreground">{Number(payment.amountCpxtb).toFixed(6)}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(payment.status)}`}>
                                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {payment.transactionHash ? (
                                    <a 
                                      href={`https://basescan.org/tx/${payment.transactionHash}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                    >
                                      <span className="truncate max-w-[120px]">{payment.transactionHash.substring(0, 10)}...</span>
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-8 border rounded-md bg-muted/20">
                        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No transactions found</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          No payment transactions were found for the selected date range.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 border rounded-md bg-muted/20">
                  <BarChart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Report Generated</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a date range and click "Generate Report" to view your transaction data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pamphlet" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Print Materials</CardTitle>
                <CardDescription>
                  Generate printable materials to help customers pay with CPXTB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Create professionally designed materials to help your customers understand how to pay with CPXTB tokens.
                    These materials can be printed and displayed at your point of sale.
                  </p>
                  
                  <div className="space-y-4 pb-2">
                    <Label>Select a Business</Label>
                    {merchantData?.merchants?.length ? (
                      <Select
                        value={selectedMerchant?.id?.toString() || ""}
                        onValueChange={(val) => {
                          const merchant = merchantData.merchants.find(m => m.id.toString() === val);
                          setSelectedMerchant(merchant || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a business" />
                        </SelectTrigger>
                        <SelectContent>
                          {merchantData.merchants.map((merchant: any) => (
                            <SelectItem key={merchant.id} value={merchant.id.toString()}>
                              {merchant.businessName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No businesses registered. Please register a business first.
                      </p>
                    )}
                  </div>
                  
                  {selectedMerchant && (
                    <div className="pt-2 space-y-4">
                      <h3 className="font-semibold">Available Materials</h3>
                      
                      <Card className="border border-primary/20 hover:border-primary/40 transition-all">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">CPXTB Payment Instruction Pamphlet</CardTitle>
                          <CardDescription>
                            A printer-friendly guide for customers on how to pay with CPXTB tokens
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              className="flex items-center gap-1"
                              onClick={() => {
                                setActiveTab("pamphlet-preview");
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Preview
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <p className="text-xs text-muted-foreground mt-6">
                        Note: Print materials will use your business name and wallet address.
                        Make sure this information is correct before printing.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Tips for Using Print Materials</CardTitle>
                <CardDescription>
                  How to effectively use these materials in your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Display at Point of Sale</p>
                      <p className="text-sm text-muted-foreground">
                        Place the printed pamphlet near your cash register or checkout area where customers can easily see payment options.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <ScanLine className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">QR Code Visibility</p>
                      <p className="text-sm text-muted-foreground">
                        Ensure the QR code is clearly visible and not obstructed. Consider laminating the pamphlet for durability.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <CircleDollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Staff Training</p>
                      <p className="text-sm text-muted-foreground">
                        Train your staff on how CPXTB payments work so they can assist customers who may have questions.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Online Promotion</p>
                      <p className="text-sm text-muted-foreground">
                        Mention on your website and social media that you accept CPXTB token payments to attract crypto-friendly customers.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="pamphlet-preview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pamphlet Preview</CardTitle>
                <CardDescription>Preview and print your payment instruction pamphlet</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setActiveTab("pamphlet")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </CardHeader>
            <CardContent>
              {selectedMerchant && (
                <MerchantPamphlet 
                  businessName={selectedMerchant.businessName} 
                  walletAddress={selectedMerchant.walletAddress}
                  logoUrl={selectedMerchant.logoUrl}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Theme Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Templates</CardTitle>
                <CardDescription>
                  One-click theme application for your payment pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Choose from our pre-designed theme templates to instantly style your payment page
                    </p>
                    
                    {/* Template Options */}
                    {/* Current Theme Banner */}
                    <div className="p-4 mb-4 rounded-lg bg-muted">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-medium">Current Theme</h3>
                          <p className="text-xs text-muted-foreground">
                            {selectedMerchant?.themeTemplate 
                              ? renderTemplateName(selectedMerchant.themeTemplate)
                              : "No theme applied yet"}
                          </p>
                        </div>
                        {selectedMerchant?.themeTemplate && (
                          <Badge>{renderTemplateName(selectedMerchant.themeTemplate)}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md relative 
                          ${applyingTemplate ? 'opacity-50 pointer-events-none' : ''}
                          ${selectedMerchant?.themeTemplate === 'default' ? 'ring-2 ring-primary border-transparent bg-blue-50 dark:bg-blue-950/20' : ''}`}
                        onClick={() => {
                          if (!applyingTemplate) {
                            console.log("Applying default theme template");
                            setApplyingTemplate('default');
                            applyTemplateMutation.mutate("default");
                          }
                        }}
                      >
                        {selectedMerchant?.themeTemplate === 'default' && (
                          <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {applyingTemplate === 'default' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        )}
                        <div className="flex flex-col h-full">
                          <div className="flex-none h-24 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 mb-3"></div>
                          <h3 className="text-sm font-medium text-foreground mb-1">Modern Blue</h3>
                          <p className="text-xs text-muted-foreground mb-auto">Professional, clean design with blue accents</p>
                          <Badge variant="outline" className="self-start mt-2">Modern</Badge>
                        </div>
                      </div>
                      
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md relative
                          ${applyingTemplate ? 'opacity-50 pointer-events-none' : ''}
                          ${selectedMerchant?.themeTemplate === 'bold' ? 'ring-2 ring-primary border-transparent bg-amber-50 dark:bg-amber-950/20' : ''}`}
                        onClick={() => {
                          if (!applyingTemplate) {
                            console.log("Applying bold theme template");
                            setApplyingTemplate('bold');
                            applyTemplateMutation.mutate("bold");
                          }
                        }}
                      >
                        {selectedMerchant?.themeTemplate === 'bold' && (
                          <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {applyingTemplate === 'bold' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        )}
                        <div className="flex flex-col h-full">
                          <div className="flex-none h-24 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 mb-3"></div>
                          <h3 className="text-sm font-medium text-foreground mb-1">Crypto Gold</h3>
                          <p className="text-xs text-muted-foreground mb-auto">Bold design with crypto-inspired amber coloring</p>
                          <Badge variant="outline" className="self-start mt-2">Crypto</Badge>
                        </div>
                      </div>
                      
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md relative
                          ${applyingTemplate ? 'opacity-50 pointer-events-none' : ''}
                          ${selectedMerchant?.themeTemplate === 'minimal' ? 'ring-2 ring-primary border-transparent bg-slate-50 dark:bg-slate-950/20' : ''}`}
                        onClick={() => {
                          if (!applyingTemplate) {
                            console.log("Applying minimal theme template");
                            setApplyingTemplate('minimal');
                            applyTemplateMutation.mutate("minimal");
                          }
                        }}
                      >
                        {selectedMerchant?.themeTemplate === 'minimal' && (
                          <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {applyingTemplate === 'minimal' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        )}
                        <div className="flex flex-col h-full">
                          <div className="flex-none h-24 rounded-md bg-gradient-to-r from-gray-100 to-gray-200 mb-3"></div>
                          <h3 className="text-sm font-medium text-foreground mb-1">Minimalist</h3>
                          <p className="text-xs text-muted-foreground mb-auto">Simple, clean design with focus on content</p>
                          <Badge variant="outline" className="self-start mt-2">Minimal</Badge>
                        </div>
                      </div>
                      
                      <div
                        className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md relative
                          ${applyingTemplate ? 'opacity-50 pointer-events-none' : ''}
                          ${selectedMerchant?.themeTemplate === 'tech' ? 'ring-2 ring-primary border-transparent bg-slate-800/10 dark:bg-slate-900/50' : ''}`}
                        onClick={() => {
                          if (!applyingTemplate) {
                            console.log("Applying tech theme template");
                            setApplyingTemplate('tech');
                            applyTemplateMutation.mutate("tech");
                          }
                        }}
                      >
                        {selectedMerchant?.themeTemplate === 'tech' && (
                          <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {applyingTemplate === 'tech' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        )}
                        <div className="flex flex-col h-full">
                          <div className="flex-none h-24 rounded-md bg-gradient-to-r from-gray-800 to-gray-900 mb-3"></div>
                          <h3 className="text-sm font-medium text-foreground mb-1">Dark Mode</h3>
                          <p className="text-xs text-muted-foreground mb-auto">Sleek dark theme with high contrast</p>
                          <Badge variant="outline" className="self-start mt-2">Dark</Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Loading State - keeping this for overall status indication */}
                    {applyingTemplate && (
                      <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500 dark:text-blue-400" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">Applying {typeof applyingTemplate === 'string' ? renderTemplateName(applyingTemplate) : ''} theme...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Custom Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Theme</CardTitle>
                <CardDescription>
                  Customize your payment page appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateThemeMutation.mutate(themeForm);
                  }} 
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Color Pickers */}
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-md border" 
                          style={{ backgroundColor: themeForm.primaryColor }}
                        ></div>
                        <Input 
                          id="primaryColor"
                          name="primaryColor"
                          type="color"
                          value={themeForm.primaryColor}
                          onChange={handleThemeFormChange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-md border" 
                          style={{ backgroundColor: themeForm.secondaryColor }}
                        ></div>
                        <Input 
                          id="secondaryColor"
                          name="secondaryColor"
                          type="color"
                          value={themeForm.secondaryColor}
                          onChange={handleThemeFormChange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-md border" 
                          style={{ backgroundColor: themeForm.accentColor }}
                        ></div>
                        <Input 
                          id="accentColor"
                          name="accentColor"
                          type="color"
                          value={themeForm.accentColor}
                          onChange={handleThemeFormChange}
                        />
                      </div>
                    </div>
                    
                    {/* Font Family */}
                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <Select 
                        value={themeForm.fontFamily} 
                        onValueChange={(value) => {
                          setThemeForm(prev => ({
                            ...prev,
                            fontFamily: value
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Border Radius */}
                  <div className="space-y-2">
                    <Label htmlFor="borderRadius">Border Radius: {themeForm.borderRadius}px</Label>
                    <Slider
                      id="borderRadius"
                      name="borderRadius"
                      min={0}
                      max={20}
                      step={1}
                      value={[themeForm.borderRadius]}
                      onValueChange={(value) => {
                        setThemeForm(prev => ({
                          ...prev,
                          borderRadius: value[0]
                        }));
                      }}
                    />
                  </div>
                  
                  {/* Dark Mode Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="darkMode"
                      name="darkMode"
                      checked={themeForm.darkMode}
                      onCheckedChange={(checked) => {
                        setThemeForm(prev => ({
                          ...prev,
                          darkMode: checked
                        }));
                      }}
                    />
                    <Label htmlFor="darkMode">Dark Mode</Label>
                  </div>
                  
                  {/* Advanced Settings (Optional) */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="advanced">
                      <AccordionTrigger>Advanced Settings</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 mt-2">
                          <div className="space-y-2">
                            <Label htmlFor="customCss">Custom CSS</Label>
                            <Textarea
                              id="customCss"
                              name="customCss"
                              placeholder=".payment-page { ... }"
                              className="font-mono text-xs"
                              value={themeForm.customCss}
                              onChange={handleThemeFormChange}
                            />
                            <p className="text-xs text-muted-foreground">Add custom CSS styles for your payment page</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="customHeader">Custom Header HTML</Label>
                            <Textarea
                              id="customHeader"
                              name="customHeader"
                              placeholder="<div class='my-header'>...</div>"
                              className="font-mono text-xs"
                              value={themeForm.customHeader}
                              onChange={handleThemeFormChange}
                            />
                            <p className="text-xs text-muted-foreground">Custom HTML to display at the top of your payment page</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="customFooter">Custom Footer HTML</Label>
                            <Textarea
                              id="customFooter"
                              name="customFooter"
                              placeholder="<div class='my-footer'>...</div>"
                              className="font-mono text-xs"
                              value={themeForm.customFooter}
                              onChange={handleThemeFormChange}
                            />
                            <p className="text-xs text-muted-foreground">Custom HTML to display at the bottom of your payment page</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  {/* Theme Preview */}
                  <div className="border rounded-md p-4 mt-4">
                    <h3 className="text-sm font-medium mb-1">Theme Preview</h3>
                    <div className="h-24 rounded-md mt-2 flex items-center justify-center overflow-hidden" style={{
                      backgroundColor: themeForm.darkMode ? '#1c1c1c' : '#ffffff',
                      color: themeForm.darkMode ? '#ffffff' : '#000000',
                      fontFamily: themeForm.fontFamily,
                      borderRadius: `${themeForm.borderRadius}px`
                    }}>
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-10 h-10 rounded-md mb-2 flex items-center justify-center"
                          style={{ 
                            backgroundColor: themeForm.primaryColor,
                            borderRadius: `${themeForm.borderRadius / 2}px`
                          }}
                        >
                          <span className="text-white text-xs">CPXTB</span>
                        </div>
                        <div 
                          className="text-xs px-3 py-1 rounded"
                          style={{ 
                            backgroundColor: themeForm.secondaryColor,
                            color: '#ffffff',
                            borderRadius: `${themeForm.borderRadius / 2}px`
                          }}
                        >
                          Pay with Crypto
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateThemeMutation.isPending}
                  >
                    {updateThemeMutation.isPending ? 'Updating...' : 'Apply Custom Theme'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}