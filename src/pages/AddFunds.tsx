import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  TrendingUp,
  History,
  ArrowLeft
} from "lucide-react";
import { getCurrentUser } from '@/lib/auth';
import { paymentService, Transaction } from '@/lib/paymentService';

interface LocationState {
  orderId?: string;
  amount?: number;
  serviceTitle?: string;
}

const AddFunds = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // Form states
  const [amount, setAmount] = useState(state?.amount || 10);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('add-funds');
  
  // Transaction states
  const [transactionHistory, setTransactionHistory] = useState<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }>({
    transactions: [],
    total: 0,
    page: 1,
    limit: 10,
    hasMore: false
  });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Payment states
  const [paymentUrl, setPaymentUrl] = useState('');
  const [showPaymentRedirect, setShowPaymentRedirect] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
        await loadUserBalance();
        await loadTransactionHistory();
      } else {
        setIsAuthenticated(false);
        navigate('/login', { state: { from: '/add-funds' } });
      }
    } catch (error) {
      setIsAuthenticated(false);
      navigate('/login', { state: { from: '/add-funds' } });
    }
  };

  const loadUserBalance = async () => {
    try {
      const balance = await paymentService.getUserBalance();
      setCurrentBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await paymentService.getTransactionHistory(1, 10);
      setTransactionHistory(history);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddFunds = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to continue');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const response = await paymentService.addFunds({
        amount,
        description: `Add funds - ${amount} USD`
      });

      if (response.success) {
        toast.success('Payment link created successfully!');
        setPaymentUrl(response.payment_url);
        setShowPaymentRedirect(true);
        
        // Update balance
        await loadUserBalance();
      } else {
        toast.error(response.message || 'Failed to create payment link');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add funds');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentRedirect = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  const handleBackToAddFunds = () => {
    setShowPaymentRedirect(false);
    setPaymentUrl('');
  };

  const getCountryFlag = (countryCode: string) => {
    // Convert country code to flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getCountryName = (countryCode: string) => {
    const countryNames: Record<string, string> = {
      'CM': 'Cameroon',
      'NG': 'Nigeria',
      'GH': 'Ghana',
      'KE': 'Kenya',
      'SN': 'Senegal',
      'CI': 'Ivory Coast',
      'UG': 'Uganda',
      'TZ': 'Tanzania',
      'US': 'United States',
      'GB': 'United Kingdom',
      'EU': 'European Union',
      'CA': 'Canada',
      'AU': 'Australia',
      'IN': 'India',
      'CN': 'China',
      'JP': 'Japan',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'ZA': 'South Africa',
      'EG': 'Egypt'
    };
    return countryNames[countryCode] || countryCode;
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'purchase':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'refund':
        return <CheckCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showPaymentRedirect) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Payment Link Created
            </CardTitle>
            <CardDescription>
              Click below to complete your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Your payment link has been created successfully. Click the button below to complete your payment.
              </p>
              <div className="space-y-4">
                <Button 
                  onClick={handlePaymentRedirect}
                  className="w-full"
                  size="lg"
                >
                  Complete Payment
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleBackToAddFunds}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Add Funds
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Account Management</h1>
        <p className="text-gray-600 mt-2">Add funds to your account and view transaction history</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-funds">Add Funds</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="add-funds" className="space-y-6">
          {/* Current Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${currentBalance.toFixed(2)} USD
              </div>
              <p className="text-muted-foreground mt-2">
                Available for purchasing services
              </p>
            </CardContent>
          </Card>

          {/* Add Funds Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Funds to Account</CardTitle>
              <CardDescription>
                Enter the amount you want to add to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  min="1"
                  step="0.01"
                />
              </div>

              <Button 
                onClick={handleAddFunds}
                disabled={isLoading || !amount || amount <= 0}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment Link...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Add Funds
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                View all your account transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : transactionHistory.transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found</p>
                  <p className="text-sm">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactionHistory.transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionTypeIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()} • {transaction.reference}
                          </p>
                          {transaction.country_code && (
                            <p className="text-xs text-muted-foreground">
                              {getCountryFlag(transaction.country_code)} {getCountryName(transaction.country_code)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {transaction.type === 'deposit' ? '+' : '-'}
                          {transaction.amount.toFixed(2)} {transaction.currency}
                        </div>
                        {getTransactionStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {transactionHistory.hasMore && (
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Load more transactions
                      const nextPage = transactionHistory.page + 1;
                      // Implementation for pagination
                    }}
                  >
                    Load More Transactions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddFunds;
