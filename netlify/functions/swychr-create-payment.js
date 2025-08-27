const axios = require('axios');

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
    const { amount, description } = JSON.parse(event.body);
    
    if (!amount || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Amount and description are required' })
      };
    }

    // Get auth token first
    const authResponse = await axios.post('https://api.accountpe.com/api/payin/admin/auth', {
      email: process.env.SWYCHR_EMAIL,
      password: process.env.SWYCHR_PASSWORD
    });

    if (authResponse.data.status !== 200) {
      throw new Error('Failed to authenticate with Swychr');
    }

    const authToken = authResponse.data.token;

    // Create payment link
    const paymentResponse = await axios.post('https://api.accountpe.com/api/payin/create_payment_links', {
      country_code: 'US',
      name: 'DigiNum User',
      email: 'user@diginum.com', // You can make this dynamic
      mobile: '+1234567890', // You can make this dynamic
      amount: amount,
      transaction_id: `diginum_${Date.now()}`,
      description: description,
      pass_digital_charge: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (paymentResponse.data.status !== 200) {
      throw new Error('Failed to create payment link');
    }

    // Extract payment URL from response
    const paymentUrl = paymentResponse.data.data?.payment_url || paymentResponse.data.data?.url;

    if (!paymentUrl) {
      throw new Error('No payment URL received from Swychr');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        paymentUrl: paymentUrl,
        transactionId: paymentResponse.data.data?.transaction_id,
        message: 'Payment link created successfully'
      })
    };

  } catch (error) {
    console.error('Swychr payment error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to create payment link'
      })
    };
  }
};
