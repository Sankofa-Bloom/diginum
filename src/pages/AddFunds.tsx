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
  Info
} from "lucide-react";
import { getCurrentUser } from '@/lib/auth';
import { paymentService, CurrencyConversionResponse } from '@/lib/paymentService';

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
  const [countryCode, setCountryCode] = useState('NG');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  
  // Currency conversion states
  const [conversionData, setConversionData] = useState<CurrencyConversionResponse | null>(null);
  const [conversionLoading, setConversionLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (amount > 0 && countryCode) {
      calculateCurrencyConversion();
    } else {
      setConversionData(null);
    }
  }, [amount, countryCode]);

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

  const calculateCurrencyConversion = async () => {
    if (amount <= 0 || !countryCode) return;
    
    setConversionLoading(true);
    try {
      const response = await paymentService.getCurrencyConversion({
        amount,
        country_code: countryCode
      });
      setConversionData(response);
    } catch (error) {
      console.error('Failed to calculate currency conversion:', error);
      setConversionData(null);
    } finally {
      setConversionLoading(false);
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

      if (response.success && response.payment_url) {
        // Directly redirect to the payment page
        window.open(response.payment_url, '_blank');
        toast.success('Redirecting to payment page...');
        
        // Update balance after successful redirect
        await loadUserBalance();
      } else {
        toast.error(response.message || 'Failed to create payment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add funds');
    } finally {
      setIsLoading(false);
    }
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
      'ZA': 'South Africa',
      'EG': 'Egypt'
    };
    return countryNames[countryCode] || countryCode;
  };

  const getCurrencyInfo = () => {
    return paymentService.getCountryCurrencyInfo(countryCode);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currencyInfo = getCurrencyInfo();

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
                {Array.isArray(paymentService.getSupportedCountries()) ? paymentService.getSupportedCountries().map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(country)}</span>
                      {getCountryName(country)}
                    </div>
                  </SelectItem>
                )) : (
                  <SelectItem value="US" disabled>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇺🇸</span>
                      United States
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Currency Conversion Display */}
          {conversionData && currencyInfo && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>Payment Details</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <div className="font-medium">${amount.toFixed(2)} USD</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Converted:</span>
                      <div className="font-medium">
                        {conversionData.data.converted_amount.toFixed(2)} {currencyInfo.currency_code}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fee (3%):</span>
                      <div className="font-medium text-orange-600">
                        {conversionData.data.fee.toFixed(2)} {currencyInfo.currency_code}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <div className="font-medium text-green-600 text-lg">
                        {conversionData.data.total_amount.toFixed(2)} {currencyInfo.currency_symbol}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleAddFunds}
            disabled={isLoading || !amount || amount <= 0 || !countryCode || conversionLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Payment...
              </>
            ) : conversionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {conversionData ? `${conversionData.data.total_amount.toFixed(2)} ${currencyInfo?.currency_symbol}` : `$${amount.toFixed(2)}`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFunds;
