import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  DollarSign, 
  ArrowLeft,
  Wallet,
  CreditCard,
  CheckCircle
} from "lucide-react";
import { getCurrentUser } from '@/lib/auth';
import { paymentService } from '@/lib/paymentService';

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
  const [countryCode, setCountryCode] = useState('US');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  
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

  const handleAddFunds = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to continue');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!countryCode) {
      toast.error('Please select a country');
      return;
    }

    setIsLoading(true);
    try {
      const response = await paymentService.addFunds({
        amount,
        country_code: countryCode
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

  const handleCountryChange = (newCountry: string) => {
    setCountryCode(newCountry);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showPaymentRedirect) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Payment Link Ready!</CardTitle>
            <CardDescription>
              Click below to complete your payment securely
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handlePaymentRedirect}
              className="w-full"
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Complete Payment
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBackToAddFunds}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Add More Funds
            </Button>
          </CardContent>
        </Card>
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
            Enter amount and select your country
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={countryCode} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {paymentService.getSupportedCountries().map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(country)}</span>
                      {getCountryName(country)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddFunds}
            disabled={isLoading || !amount || amount <= 0 || !countryCode}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Payment...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Add ${amount.toFixed(2)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFunds;
