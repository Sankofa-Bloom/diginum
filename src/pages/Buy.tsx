import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Search, 
  Wallet, 
  RefreshCw, 
  ArrowLeft,
  DollarSign,
  Info
} from "lucide-react";
import { getCurrentUser } from '@/lib/auth';
import { paymentService, CountryCurrencyInfo } from '@/lib/paymentService';
import apiClient from '@/lib/apiClient';

interface Country {
  id: string;
  name: string;
  code: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  countryId: string;
  available: boolean;
}

interface OrderResult {
  orderId: string;
  phoneNumber: string;
  expiresAt: string;
  timeRemaining: number;
  amountPaid: number;
  newBalance: number;
  message: string;
}

const Buy = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Flow states
  const [step, setStep] = useState<'countries' | 'services' | 'number' | 'verification'>('countries');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  
  // Account balance
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  // Loading states
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingNumber, setLoadingNumber] = useState(false);
  
  // Search states
  const [serviceSearch, setServiceSearch] = useState('');
  
  // Data states
  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Filtered services based on selected country
  const filteredServices = services.filter(service => 
    serviceSearch.trim() === '' || 
    service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    service.description.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
        
        if (user) {
          loadAccountBalance();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loadAccountBalance = async () => {
    setLoadingBalance(true);
    try {
      const balance = await paymentService.getUserBalance();
      setAccountBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
      toast.error('Failed to load account balance');
      setAccountBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await apiClient.get('/countries');
      setCountries(response);
    } catch (error) {
      console.error('Failed to load countries:', error);
      toast.error('Failed to load countries. Please try again.');
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadServices = async (countryId: string) => {
    setLoadingServices(true);
    try {
      const response = await apiClient.get(`/services/${countryId}`);
      setServices(response);
      setStep('services');
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load services. Please try again.');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleCountrySelect = (country: Country) => {
    if (!isAuthenticated) {
      toast.error('Please log in to continue with your purchase.');
      navigate('/login', { state: { from: '/buy' } });
      return;
    }
    
    setSelectedCountry(country);
    loadServices(country.id);
  };

  const handleServiceSelect = (service: Service) => {
    if (accountBalance < service.price) {
      toast.error('Insufficient balance. Please add funds to continue.');
      navigate('/add-funds', { 
        state: { 
          amount: service.price,
          serviceTitle: service.name
        }
      });
      return;
    }
    
    setSelectedService(service);
    generateNumber(service);
  };

  const generateNumber = async (service: Service) => {
    setLoadingNumber(true);
    try {
      // Use the payment service for payment processing
      const result = await paymentService.processServicePurchase(parseInt(service.id), selectedCountry?.id || '');
      
      if (result.success && result.orderId) {
        // Get the updated balance
        const newBalance = await paymentService.getUserBalance();
        setAccountBalance(newBalance);
        
        // Create order result for display
        const orderResult: OrderResult = {
          orderId: result.orderId,
          phoneNumber: `+${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Generate random number
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
          timeRemaining: 10 * 60,
          amountPaid: service.price,
          newBalance: newBalance,
          message: result.message
        };
        
        setOrderResult(orderResult);
        setStep('number');
        toast.success('Phone number generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate phone number');
      }
    } catch (error: any) {
      console.error('Error generating number:', error);
      toast.error('Failed to generate phone number. Please try again.');
    } finally {
      setLoadingNumber(false);
    }
  };

  const resetFlow = () => {
    setStep('countries');
    setSelectedCountry(null);
    setSelectedService(null);
    setOrderResult(null);
    setServiceSearch('');
    setServices([]);
  };

  // Load countries when component mounts
  useEffect(() => {
    if (step === 'countries') {
      loadCountries();
    }
  }, [step]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Buy Phone Number</h1>
          <p className="text-muted-foreground">Select a country and service to get a verification number</p>
          
          {/* Login Prompt */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Login Required</span>
              </div>
              <Button onClick={() => navigate('/login', { state: { from: '/buy' } })}>
                Login to Continue
              </Button>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              You need to be logged in to purchase a phone number. Please log in to continue.
            </p>
          </div>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingCountries ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading countries...
            </div>
          ) : (
            {Array.isArray(countries) ? countries.map((country) => (
              <Card key={country.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">📞</div>
                  <h3 className="font-semibold">{country.name}</h3>
                  <p className="text-sm text-muted-foreground">{country.code}</p>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No countries available
              </div>
            )}
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Buy Phone Number</h1>
        <p className="text-muted-foreground">Select a country and service to get a verification number</p>
        
        {/* Account Balance Display */}
        <div className="mt-4 flex items-center justify-between bg-primary/5 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-semibold">Account Balance:</span>
            {loadingBalance ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">${accountBalance.toFixed(2)}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadAccountBalance}
                  className="h-6 w-6 p-0"
                  disabled={loadingBalance}
                  title="Refresh balance"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          <Button
            onClick={() => navigate('/add-funds')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            Add Funds
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${step === 'countries' || step === 'services' || step === 'number' || step === 'verification' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'countries' || step === 'services' || step === 'number' || step === 'verification' ? 'bg-primary text-white' : 'bg-muted'}`}>
              1
            </div>
            <span className="ml-2">Country</span>
          </div>
          <div className="w-8 h-1 bg-muted"></div>
          <div className={`flex items-center ${step === 'services' || step === 'number' || step === 'verification' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'services' || step === 'number' || step === 'verification' ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span className="ml-2">Service</span>
          </div>
          <div className="w-8 h-1 bg-muted"></div>
          <div className={`flex items-center ${step === 'number' || step === 'verification' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'number' || step === 'verification' ? 'bg-primary text-white' : 'bg-muted'}`}>
              3
            </div>
            <span className="ml-2">Number</span>
          </div>
          <div className="w-8 h-1 bg-muted"></div>
          <div className={`flex items-center ${step === 'verification' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'verification' ? 'bg-primary text-white' : 'bg-muted'}`}>
              4
            </div>
            <span className="ml-2">Code</span>
          </div>
        </div>
      </div>

      {/* Step 1: Country Selection */}
      {step === 'countries' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5" />
              Select Country
            </CardTitle>
            <CardDescription>Choose a country to get a phone number from</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCountries ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading countries...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.isArray(countries) ? countries.map((country) => (
                  <Card 
                    key={country.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCountrySelect(country)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">📞</div>
                      <h3 className="font-semibold">{country.name}</h3>
                      <p className="text-sm text-muted-foreground">{country.code}</p>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No countries available
                  </div>
                )}
              </div>
            )}
            
            {!loadingCountries && countries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No countries available at the moment.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Service Selection */}
      {step === 'services' && selectedCountry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Select Service
            </CardTitle>
            <CardDescription>
              Choose a service for {selectedCountry.name} ({selectedCountry.code})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search services by name or description..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {loadingServices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading services...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(filteredServices) ? filteredServices.map((service) => (
                  <Card 
                    key={service.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      accountBalance < service.price ? 'opacity-50' : ''
                    }`}
                    onClick={() => accountBalance >= service.price && handleServiceSelect(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${service.price}</p>
                          {accountBalance < service.price ? (
                            <Badge variant="destructive">Insufficient Balance</Badge>
                          ) : (
                            <Badge variant="secondary">Available</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No services available
                  </div>
                )}
              </div>
            )}
            
            {!loadingServices && filteredServices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {serviceSearch ? 'No services found matching your search.' : 'No services available for this country.'}
              </div>
            )}
            
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={resetFlow}>
                Back to Countries
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Number Generation */}
      {step === 'number' && orderResult && selectedService && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Your Phone Number
            </CardTitle>
            <CardDescription>
              Your {selectedService.name} number has been generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="bg-primary/10 rounded-lg p-6 mb-6">
                <h3 className="text-2xl font-bold text-primary mb-2">{orderResult.phoneNumber}</h3>
                <p className="text-muted-foreground">Service: {selectedService.name}</p>
                <p className="text-muted-foreground">Amount Paid: ${orderResult.amountPaid}</p>
                <p className="text-muted-foreground">New Balance: ${orderResult.newBalance}</p>
                <p className="text-muted-foreground">Expires in: 10 minutes</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => setStep('verification')}
                  className="w-full"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Get Verification Code
                </Button>
                
                <Button variant="outline" onClick={resetFlow} className="w-full">
                  Start Over
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Verification Code */}
      {step === 'verification' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Verification Code
            </CardTitle>
            <CardDescription>
              Your verification code has been sent to your phone number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-3xl font-bold text-green-600 mb-2">123456</h3>
                <p className="text-green-700">Use this code to verify your account</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                
                <Button variant="outline" onClick={resetFlow} className="w-full">
                  Buy Another Number
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Buy;
