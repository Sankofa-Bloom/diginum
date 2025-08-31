const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase env missing. Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to send CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event, context) => {
  console.log('=== PAYMENT WEBHOOK HANDLER START ===');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the webhook payload
    const webhookData = JSON.parse(event.body);
    console.log('Webhook payload received:', webhookData);

    // Extract payment information from webhook
    const {
      transaction_id,
      status,
      amount,
      currency,
      payment_method,
      customer_email,
      customer_name,
      country_code
    } = webhookData;

    if (!transaction_id) {
      console.error('Missing transaction_id in webhook payload');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing transaction_id' })
      };
    }

    console.log(`Processing webhook for transaction: ${transaction_id} with status: ${status}`);

    try {
      // Update transaction status in database
      const { data: transaction, error: updateError } = await supabaseAdmin
        .from('transactions')
        .update({
          status: mapWebhookStatus(status),
          updated_at: new Date().toISOString(),
          metadata: {
            payment_method,
            webhook_received_at: new Date().toISOString(),
            webhook_data: webhookData
          }
        })
        .eq('transaction_id', transaction_id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update transaction:', updateError);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to update transaction' })
        };
      }

      // If payment is completed, credit the user's account
      if (status === 'completed' || status === 'success') {
        await creditUserAccount(transaction_id, amount, currency);
      }

      console.log(`Successfully processed webhook for transaction: ${transaction_id}`);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Webhook processed successfully',
          transaction_id
        })
      };

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Database operation failed' })
      };
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Map webhook status to internal transaction status
 */
function mapWebhookStatus(webhookStatus) {
  switch (webhookStatus?.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'paid':
      return 'completed';
    case 'failed':
    case 'error':
    case 'declined':
      return 'failed';
    case 'cancelled':
    case 'expired':
      return 'cancelled';
    case 'pending':
    case 'processing':
    default:
      return 'pending';
  }
}

/**
 * Credit user account after successful payment
 */
async function creditUserAccount(transactionId, amount, currency = 'USD') {
  try {
    console.log(`Crediting user account for transaction: ${transactionId}`);

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select('user_id, amount, currency')
      .eq('transaction_id', transactionId)
      .single();

    if (transactionError || !transaction) {
      console.error('Transaction not found:', transactionId);
      return;
    }

    // Get or create user balance record
    let { data: balance, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('*')
      .eq('user_id', transaction.user_id)
      .eq('currency', transaction.currency)
      .single();

    if (balanceError && balanceError.code === 'PGRST116') {
      // Create new balance record
      const { error: createError } = await supabaseAdmin
        .from('user_balances')
        .insert({
          user_id: transaction.user_id,
          currency: transaction.currency,
          balance: transaction.amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('Failed to create balance record:', createError);
        return;
      }
      
      console.log(`Created new balance record for user: ${transaction.user_id}`);
    } else if (balanceError) {
      console.error('Error fetching existing balance:', balanceError);
      return;
    } else {
      // Update existing balance
      const newBalance = (balance.balance || 0) + transaction.amount;
      const { error: updateError } = await supabaseAdmin
        .from('user_balances')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id)
        .eq('currency', transaction.currency);

      if (updateError) {
        console.error('Failed to update balance:', updateError);
        return;
      }
      
      console.log(`Updated balance for user: ${transaction.user_id}, new balance: ${newBalance}`);
    }

    console.log(`Successfully credited account for transaction: ${transactionId}`);

  } catch (error) {
    console.error('Error crediting user account:', error);
  }
}
