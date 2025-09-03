import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  DollarSign, 
  ArrowLeft,
  Wallet,
  CreditCard,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { getCurrentUser } from '@/lib/auth';

interface LocationState {
  orderId?: string;
  amount?: number;
  serviceTitle?: string;
}

interface PaymentRequest {
  amount: number;
  name: string;
  email: string;
  mobile?: string;
  description?: string;
}

interface PaymentResponse {
  success: boolean;
  data?: {
    payment_url: string;
    transaction_id: string;
  };
  message: string;
}

const AddFunds = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // Form states
  const [amount, setAmount] = useState(state?.amount || 10);
  const [user, setUser] = useState<any>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Quick amount buttons
  const quickAmounts = [5, 10, 25, 50, 100];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        await loadUserBalance();
      } else {
        setIsAuthenticated(false);
        navigate('/login', { state: { from: '/add-funds' } });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      navigate('/login', { state: { from: '/add-funds' } });
    }
  };

  const loadUserBalance = async () => {
    try {
      // For now, we'll use a simple balance from localStorage or default to 0
      // In a real app, this would come from your backend
      const balance = localStorage.getItem('user_balance');
      setCurrentBalance(balance ? parseFloat(balance) : 0);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setCurrentBalance(0);
    }
  };

  const createPaymentLink = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
    try {
      // Generate unique transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare payment request according to Swychr API
      const requestBody = {
        country_code: 'CM', // Default to Cameroon as per your requirements
        name: paymentData.name,
        email: paymentData.email,
        mobile: paymentData.mobile,
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        transaction_id: transactionId,
        description: paymentData.description || `Add funds to DigiNum account - $${paymentData.amount} USD`,
        pass_digital_charge: false
      };

      // Call the Netlify function which will proxy to Swychr API
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.payment_url) {
        return {
          success: true,
          data: {
            payment_url: data.data.payment_url,
            transaction_id: transactionId
          },
          message: 'Payment link created successfully'
        };
      } else {
        throw new Error(data.message || 'Failed to create payment link');
      }
    } catch (error) {
      console.error('Create payment link error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payment link'
      };
    }
  };

  const handleAddFunds = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please log in to continue');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < 1) {
      toast.error('Minimum amount is $1 USD');
      return;
    }

    setIsCreatingPayment(true);
    try {
      const paymentData: PaymentRequest = {
        amount,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        mobile: user.phone || undefined,
        description: `Add funds to DigiNum account - $${amount} USD`
      };

      const response = await createPaymentLink(paymentData);

      if (response.success && response.data?.payment_url) {
        // Store transaction ID for later verification
        localStorage.setItem('pending_transaction', response.data.transaction_id);
        
        toast.success('Redirecting to payment page...');
        
        // Open payment page in new tab
        window.open(response.data.payment_url, '_blank');
        
        // Show success message
        toast.success('Payment page opened in new tab. Complete payment to add funds to your account.');
        
        // Navigate back to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast.error(response.message || 'Failed to create payment link');
      }
    } catch (error: any) {
      console.error('Add funds error:', error);
      toast.error(error.message || 'Failed to add funds. Please try again.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">Add Funds</h1>
        <p className="text-gray-600 mt-2">Quickly add money to your account</p>
      </div>

      {/* Current Balance */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Current Balance</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            ${currentBalance.toFixed(2)} USD
          </div>
        </CardContent>
      </Card>

      {/* Add Funds Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Add Funds
          </CardTitle>
          <CardDescription>
            Enter the amount you want to add to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="1"
              step="0.01"
              className="text-lg"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Amounts</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant={amount === quickAmount ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className="h-10"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Payment Details</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Amount:</span>
                    <span className="font-medium text-blue-900">${amount.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Payment Method:</span>
                    <span className="font-medium text-blue-900">Mobile Money</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Country:</span>
                    <span className="font-medium text-blue-900">Cameroon</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <p>You will be redirected to a secure payment page to complete your transaction. The payment will be processed in your local currency (XAF) using Mobile Money.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Funds Button */}
          <Button 
            onClick={handleAddFunds}
            disabled={isCreatingPayment || !amount || amount <= 0}
            className="w-full"
            size="lg"
          >
            {isCreatingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Payment Link...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Add ${amount.toFixed(2)} to Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6 bg-gray-50">
        <CardContent className="pt-4">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you encounter any issues with payment, please contact our support team.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const message = encodeURIComponent("Hello, I need help with adding funds to my DigiNum account");
                window.open(`https://wa.me/237673289043?text=${message}`, '_blank');
              }}
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFunds;