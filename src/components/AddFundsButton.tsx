import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

interface AddFundsButtonProps {
  amount?: number;
  className?: string;
}

const AddFundsButton: React.FC<AddFundsButtonProps> = ({ amount = 10, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFunds = async () => {
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
  };

  return (
    <Button
      onClick={handleAddFunds}
      disabled={isLoading}
      className={`bg-green-600 hover:bg-green-700 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Plus className="h-4 w-4 mr-2" />
      )}
      Add ${amount}
    </Button>
  );
};

export default AddFundsButton;
