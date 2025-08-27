const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    
    // Verify this is a payment success notification
    if (payload.status !== 'success' || !payload.transaction_id) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Not a successful payment' })
      };
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Extract transaction details
    const transactionId = payload.transaction_id;
    const amount = payload.amount || 0;
    const userId = payload.user_id || 'anonymous'; // You can make this dynamic

    // Add funds to user's balance
    const { data: existingBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .eq('currency', 'USD')
      .single();

    let newBalance = amount;
    
    if (balanceError && balanceError.code === 'PGRST116') {
      // Create new balance record
      const { error: insertError } = await supabase
        .from('user_balances')
        .insert([{
          user_id: userId,
          balance: amount,
          currency: 'USD',
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw new Error(`Failed to create balance record: ${insertError.message}`);
      }
    } else if (balanceError) {
      throw new Error(`Failed to fetch balance: ${balanceError.message}`);
    } else {
      // Update existing balance
      newBalance = parseFloat(existingBalance.balance || 0) + amount;
      
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('currency', 'USD');

      if (updateError) {
        throw new Error(`Failed to update balance: ${updateError.message}`);
      }
    }

    // Log the successful payment
    console.log(`Payment successful: User ${userId} added $${amount/100} to balance. New balance: $${newBalance/100}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Payment processed successfully',
        userId,
        amount,
        newBalance
      })
    };

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to process webhook'
      })
    };
  }
};
