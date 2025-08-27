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
    // TEMPORARILY DISABLED - Swychr API is down
    alert('⚠️ Payment service temporarily unavailable\n\nSwychr payment gateway is currently experiencing technical difficulties. Please try again later or contact support.');
    return;

    // Original code commented out until API is fixed
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
      title="Payment service temporarily unavailable - Swychr API is down"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <AlertTriangle className="h-4 w-4 mr-2" />
      )}
      Add ${amount} (Maintenance)
    </Button>
  );
};

export default AddFundsButton;
