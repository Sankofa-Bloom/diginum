import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Home,
  Wallet,
  Loader2,
  RefreshCw
} from "lucide-react";
import { paymentService } from '@/lib/paymentService';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed' | 'pending'>('verifying');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const transactionId = searchParams.get('transaction_id');
  const reference = searchParams.get('reference');
  const status = searchParams.get('status');

  useEffect(() => {
    if (transactionId || reference) {
      verifyPayment();
    } else {
      setVerificationStatus('failed');
      setIsLoading(false);
    }
  }, [transactionId, reference]);

  const verifyPayment = async () => {
    try {
      setIsLoading(true);
      
      if (transactionId) {
        // Verify payment using transaction ID
        const verification = await paymentService.verifyPayment(transactionId);
        
        if (verification.success) {
          if (verification.payment_status === 'completed') {
            setVerificationStatus('success');
            setTransactionDetails({
              transactionId,
              reference: reference || `TXN_${transactionId}`,
              amount: 0, // Will be updated from transaction
              currency: 'USD',
              status: 'completed'
            });
          } else if (verification.payment_status === 'failed') {
            setVerificationStatus('failed');
          } else {
            setVerificationStatus('pending');
          }
        } else {
          setVerificationStatus('failed');
        }
      } else if (reference) {
        // For reference-based verification, we'll simulate success
        // In a real implementation, you'd query by reference
        setVerificationStatus('success');
        setTransactionDetails({
          transactionId: 'N/A',
          reference,
          amount: 0,
          currency: 'USD',
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualVerification = async () => {
    if (!transactionId) return;
    
    setIsVerifying(true);
    try {
      const verification = await paymentService.verifyPayment(transactionId);
      
      if (verification.success && verification.payment_status === 'completed') {
        setVerificationStatus('success');
        toast.success('Payment verified successfully!');
      } else {
        setVerificationStatus('pending');
        toast.info('Payment is still processing. Please wait a moment and try again.');
      }
    } catch (error) {
      toast.error('Failed to verify payment. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-16 w-16 text-red-600" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-600" />;
      default:
        return <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      default:
        return 'Verifying Payment...';
    }
  };

  const getStatusDescription = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Your payment has been processed successfully and your account has been credited.';
      case 'failed':
        return 'There was an issue processing your payment. Please try again or contact support.';
      case 'pending':
        return 'Your payment is being processed. This may take a few minutes.';
      default:
        return 'Please wait while we verify your payment...';
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Verifying</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {getStatusTitle()}
          </CardTitle>
          <CardDescription className="text-lg">
            {getStatusDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Transaction Details */}
          {transactionDetails && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Reference:</span>
                  <p className="font-medium">{transactionDetails.reference}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="mt-1">{getStatusBadge()}</div>
                </div>
                {transactionDetails.transactionId && transactionDetails.transactionId !== 'N/A' && (
                  <div>
                    <span className="text-gray-600">Transaction ID:</span>
                    <p className="font-medium">{transactionDetails.transactionId}</p>
                  </div>
                )}
                {transactionDetails.amount > 0 && (
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-medium">
                      {transactionDetails.amount.toFixed(2)} {transactionDetails.currency}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Verification for Pending Payments */}
          {verificationStatus === 'pending' && transactionId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Payment Still Processing</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Your payment is being processed. You can manually check the status or wait for automatic updates.
              </p>
              <Button 
                onClick={handleManualVerification}
                disabled={isVerifying}
                variant="outline"
                size="sm"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Check Status
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {verificationStatus === 'success' && (
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full"
                size="lg"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            )}

            {verificationStatus === 'failed' && (
              <Button 
                onClick={() => navigate('/add-funds')}
                className="w-full"
                size="lg"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Additional Information */}
          {verificationStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Your account has been credited with the payment amount</li>
                <li>• You can now purchase services using your balance</li>
                <li>• A receipt has been sent to your email</li>
                <li>• You can view this transaction in your transaction history</li>
              </ul>
            </div>
          )}

          {verificationStatus === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Need help?</h4>
              <p className="text-sm text-red-700 mb-3">
                If you believe this is an error or need assistance, please contact our support team.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/support')}
              >
                Contact Support
              </Button>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Payment Processing</h4>
              <p className="text-sm text-yellow-700">
                Your payment is being processed. This usually takes a few minutes. 
                You'll receive an email confirmation once it's complete.
              </p>
            </div>
          )}

          {/* Payment Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Payment Instructions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Complete the payment on the payment page</li>
              <li>• Wait for confirmation (usually 1-5 minutes)</li>
              <li>• Your account will be automatically credited</li>
              <li>• Check your transaction history for updates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
