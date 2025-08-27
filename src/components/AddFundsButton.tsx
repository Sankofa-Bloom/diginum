import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, AlertTriangle } from 'lucide-react';

interface AddFundsButtonProps {
  amount?: number;
  className?: string;
}

const AddFundsButton: React.FC<AddFundsButtonProps> = ({ amount = 10, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFunds = async () => {
    // TEMPORARILY DISABLED - Swychr API is consistently returning 500 errors
    alert('⚠️ Payment service temporarily unavailable\n\nSwychr payment gateway is experiencing a service outage. Their API is returning server errors.\n\nWe are monitoring the situation and will restore service as soon as possible.\n\nPlease try again later or contact support for alternative payment methods.');
    return;

    // Original code commented out until Swychr fixes their service
    /*
    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/swychr-create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          description: `Add ${amount} USD to account`,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.paymentUrl) {
        // Redirect to Swychr payment page
        window.location.href = data.paymentUrl;
      } else {
        alert('Failed to create payment. Please try again.');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error creating payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
    */
  };

  return (
    <Button
      onClick={handleAddFunds}
      disabled={isLoading}
      className={`bg-yellow-600 hover:bg-yellow-700 ${className}`}
      title="Payment service temporarily unavailable - Swychr API is experiencing service outage"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <AlertTriangle className="h-4 w-4 mr-2" />
      )}
      Add ${amount} (Service Outage)
    </Button>
  );
};

export default AddFundsButton;
