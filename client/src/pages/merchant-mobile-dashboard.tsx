import React, { useState, useEffect } from 'react';
import { 
  Wallet, CreditCard, BarChart3, History, QrCode, 
  Settings, LogOut, Copy, ExternalLink, RefreshCw, 
  Download, DollarSign, Store, PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MobileLayout from '@/components/mobile-layout';
import { useSocialLogin } from '../providers/SocialLoginProvider';
import { useLocation } from 'wouter';
import "../styles/pancake-theme.css";
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

export default function MerchantMobileDashboard() {
  const { toast } = useToast();
  const { userInfo, walletAddress, logout } = useSocialLogin();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copied, setCopied] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [amount, setAmount] = useState('10.00');
  const [reference, setReference] = useState(`PAY-${Date.now().toString().substring(5, 13)}`);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [hasMerchantAccount, setHasMerchantAccount] = useState(false);
  
  // Mock data for dashboard
  const [merchantStats, setMerchantStats] = useState({
    totalPayments: 0,
    totalRevenue: '0',
    pendingPayments: 0
  });
  
  // Mock recent transactions data
  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: '1',
      date: '2025-05-20',
      amount: '250.00',
      status: 'completed',
      reference: 'PAY-58392044'
    },
    {
      id: '2',
      date: '2025-05-19',
      amount: '125.50',
      status: 'completed',
      reference: 'PAY-11938471'
    },
    {
      id: '3',
      date: '2025-05-18',
      amount: '75.25',
      status: 'pending',
      reference: 'PAY-39281734'
    }
  ]);

  useEffect(() => {
    // Check if user is authenticated
    if (!userInfo || !walletAddress) {
      toast({
        title: "Not authenticated",
        description: "Please login to access the merchant dashboard",
        variant: "destructive"
      });
      setLocation('/mobile-merchant-auth');
      return;
    }

    // Set email from user info if available
    if (userInfo && userInfo.email) {
      setContactEmail(userInfo.email);
    }

    // Fetch merchant data (mocked for now)
    checkMerchantAccount();
  }, [userInfo, walletAddress, setLocation, toast]);

  const checkMerchantAccount = () => {
    // This would normally check with the backend if the user has a registered merchant account
    // For now, we'll assume they don't have one
    setHasMerchantAccount(false);
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateQrCode = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingQr(true);
    // Here you would normally generate a QR code for payment
    setTimeout(() => {
      setIsGeneratingQr(false);
      toast({
        title: "QR Code Generated",
        description: `Payment QR code for ${amount} CPXTB ready`,
      });
    }, 1000);
  };

  const handleCreateMerchantAccount = () => {
    if (!businessName) {
      toast({
        title: "Missing Information",
        description: "Please enter a business name",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Creating Account",
      description: "Setting up your merchant account...",
    });

    // Simulate API call
    setTimeout(() => {
      setHasMerchantAccount(true);
      toast({
        title: "Account Created",
        description: "Your merchant account is ready to use",
      });
    }, 1500);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Signed Out",
        description: "You've been signed out successfully",
      });
      setLocation('/mobile-merchant-auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <MobileLayout title="Merchant Dashboard" hideNav={false} activeTab="profile">
      <div className="flex flex-col items-center pb-16">
        {/* User Info Area */}
        <div className="w-full p-4 bg-slate-800/50 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-medium text-white">
                  {userInfo?.username || 'Merchant'}
                </h2>
                <p className="text-xs text-slate-400">{userInfo?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Merchant Account Tabs */}
        <Tabs defaultValue="dashboard" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="px-4">
            {hasMerchantAccount ? (
              <>
                {/* Balance Card */}
                <Card className="bg-slate-800 border-slate-700 p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-slate-300">Total Balance</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">{merchantStats.totalRevenue}</span>
                    <span className="ml-1 text-sm text-slate-400">CPXTB</span>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" className="text-xs flex-1 bg-blue-600 hover:bg-blue-700">
                      <Download className="h-3 w-3 mr-1" />
                      Withdraw
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs flex-1 border-slate-600">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Chain
                    </Button>
                  </div>
                </Card>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <Card className="bg-slate-800 border-slate-700 p-3">
                    <div className="flex flex-col items-center">
                      <div className="bg-blue-500/20 p-2 rounded-full mb-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-lg font-bold text-white">{merchantStats.totalPayments}</span>
                      <span className="text-xs text-slate-400">Payments</span>
                    </div>
                  </Card>
                  
                  <Card className="bg-slate-800 border-slate-700 p-3">
                    <div className="flex flex-col items-center">
                      <div className="bg-green-500/20 p-2 rounded-full mb-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-lg font-bold text-white">{merchantStats.totalRevenue}</span>
                      <span className="text-xs text-slate-400">Revenue</span>
                    </div>
                  </Card>
                  
                  <Card className="bg-slate-800 border-slate-700 p-3">
                    <div className="flex flex-col items-center">
                      <div className="bg-yellow-500/20 p-2 rounded-full mb-2">
                        <History className="h-4 w-4 text-yellow-500" />
                      </div>
                      <span className="text-lg font-bold text-white">{merchantStats.pendingPayments}</span>
                      <span className="text-xs text-slate-400">Pending</span>
                    </div>
                  </Card>
                </div>

                {/* Recent Transactions */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-white">Recent Transactions</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-400 hover:text-blue-300"
                      onClick={() => setActiveTab('payments')}
                    >
                      View All
                    </Button>
                  </div>
                  
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {recentTransactions.map(tx => (
                        <Card key={tx.id} className="bg-slate-800 border-slate-700 p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-white">{tx.amount} CPXTB</div>
                              <div className="text-xs text-slate-400">{tx.date}</div>
                            </div>
                            <div className="flex items-center">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                tx.status === 'completed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-slate-800 border-slate-700 p-4 text-center">
                      <p className="text-slate-400 text-sm">No transactions yet</p>
                    </Card>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mb-4">
                  <h3 className="font-medium text-white mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex flex-col items-center justify-center h-24 bg-blue-600 hover:bg-blue-700">
                          <QrCode className="h-6 w-6 mb-2" />
                          <span>Create Payment</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white border-slate-700">
                        <DialogHeader>
                          <DialogTitle>Create Payment Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm text-slate-300 mb-1 block">Amount (CPXTB)</label>
                            <Input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="bg-slate-900 border-slate-700"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-300 mb-1 block">Reference</label>
                            <Input
                              value={reference}
                              onChange={(e) => setReference(e.target.value)}
                              className="bg-slate-900 border-slate-700"
                              placeholder="PAY-123456"
                            />
                          </div>
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={handleGenerateQrCode}
                            disabled={isGeneratingQr}
                          >
                            {isGeneratingQr ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                              </>
                            ) : (
                              <>
                                <QrCode className="h-4 w-4 mr-2" />
                                Generate QR Code
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      className="flex flex-col items-center justify-center h-24 bg-slate-700 hover:bg-slate-600"
                      onClick={() => setActiveTab('payments')}
                    >
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span>View Analytics</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Card className="bg-slate-800 border-slate-700 p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Store className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Create Merchant Account</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Register your business to start accepting CPXTB payments
                  </p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActiveTab('settings')}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Register Now
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
          
          {/* Payments Tab */}
          <TabsContent value="payments" className="px-4">
            {hasMerchantAccount ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-white">Payment History</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs">
                        <QrCode className="h-3 w-3 mr-1" />
                        New Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-slate-800 text-white border-slate-700">
                      <DialogHeader>
                        <DialogTitle>Create Payment Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm text-slate-300 mb-1 block">Amount (CPXTB)</label>
                          <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-slate-900 border-slate-700"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-300 mb-1 block">Reference</label>
                          <Input
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="bg-slate-900 border-slate-700"
                            placeholder="PAY-123456"
                          />
                        </div>
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={handleGenerateQrCode}
                          disabled={isGeneratingQr}
                        >
                          {isGeneratingQr ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>
                              <QrCode className="h-4 w-4 mr-2" />
                              Generate QR Code
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="mb-4">
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                      <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
                      <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="space-y-3">
                      {recentTransactions.length > 0 ? (
                        recentTransactions.map(tx => (
                          <Card key={tx.id} className="bg-slate-800 border-slate-700 p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium text-white">{tx.amount} CPXTB</div>
                                <div className="text-xs text-slate-400">{tx.reference}</div>
                                <div className="text-xs text-slate-400">{tx.date}</div>
                              </div>
                              <div className="flex items-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  tx.status === 'completed' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {tx.status}
                                </span>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <Card className="bg-slate-800 border-slate-700 p-4 text-center">
                          <p className="text-slate-400 text-sm">No transactions found</p>
                        </Card>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="completed" className="space-y-3">
                      {recentTransactions.filter(tx => tx.status === 'completed').length > 0 ? (
                        recentTransactions
                          .filter(tx => tx.status === 'completed')
                          .map(tx => (
                            <Card key={tx.id} className="bg-slate-800 border-slate-700 p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm font-medium text-white">{tx.amount} CPXTB</div>
                                  <div className="text-xs text-slate-400">{tx.reference}</div>
                                  <div className="text-xs text-slate-400">{tx.date}</div>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                    completed
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))
                      ) : (
                        <Card className="bg-slate-800 border-slate-700 p-4 text-center">
                          <p className="text-slate-400 text-sm">No completed transactions</p>
                        </Card>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="pending" className="space-y-3">
                      {recentTransactions.filter(tx => tx.status === 'pending').length > 0 ? (
                        recentTransactions
                          .filter(tx => tx.status === 'pending')
                          .map(tx => (
                            <Card key={tx.id} className="bg-slate-800 border-slate-700 p-3">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm font-medium text-white">{tx.amount} CPXTB</div>
                                  <div className="text-xs text-slate-400">{tx.reference}</div>
                                  <div className="text-xs text-slate-400">{tx.date}</div>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                                    pending
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))
                      ) : (
                        <Card className="bg-slate-800 border-slate-700 p-4 text-center">
                          <p className="text-slate-400 text-sm">No pending transactions</p>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            ) : (
              <Card className="bg-slate-800 border-slate-700 p-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Payment History</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Create a merchant account first to start accepting payments
                  </p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActiveTab('settings')}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Register Now
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="px-4">
            {hasMerchantAccount ? (
              <>
                <Card className="bg-slate-800 border-slate-700 p-4 mb-4">
                  <h3 className="font-medium text-white mb-3">Merchant Profile</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Business Name</label>
                      <Input
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Business Type</label>
                      <Input
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700 p-4 mb-4">
                  <h3 className="font-medium text-white mb-3">Wallet Address</h3>
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md p-2">
                    <div className="truncate flex-1 text-sm text-slate-300">
                      {walletAddress || '0x0000...0000'}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      onClick={handleCopyAddress}
                    >
                      {copied ? (
                        <span className="text-green-500 text-xs">Copied ✓</span>
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700 p-4 mb-4">
                  <h3 className="font-medium text-white mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Email</label>
                      <Input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Phone (Optional)</label>
                      <Input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Website (Optional)</label>
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </Card>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </>
            ) : (
              <Card className="bg-slate-800 border-slate-700 p-4">
                <h3 className="font-medium text-white mb-4">Register as a Merchant</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Business Name*</label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="Your Business LLC"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Business Type</label>
                    <Input
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="e.g. Retail, Services, E-commerce"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Contact Email*</label>
                    <Input
                      type="email"
                      value={contactEmail || (userInfo?.email || '')}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="contact@yourbusiness.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Phone (Optional)</label>
                    <Input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Website (Optional)</label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white"
                      placeholder="https://yourbusiness.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Wallet Address</label>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md p-2">
                      <div className="truncate flex-1 text-sm text-slate-300">
                        {walletAddress || '0x0000...0000'}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-slate-400 hover:text-white"
                        onClick={handleCopyAddress}
                      >
                        {copied ? (
                          <span className="text-green-500 text-xs">Copied ✓</span>
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      This address will be used to receive payments
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleCreateMerchantAccount}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Create Merchant Account
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}