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
    console.log('Swychr payment function called with:', { 
      body: event.body,
      env: {
        SWYCHR_EMAIL: process.env.SWYCHR_EMAIL ? 'SET' : 'NOT_SET',
        SWYCHR_PASSWORD: process.env.SWYCHR_PASSWORD ? 'SET' : 'NOT_SET'
      }
    });

    const { amount, description } = JSON.parse(event.body);
    
    if (!amount || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Amount and description are required' })
      };
    }

    console.log('Attempting to authenticate with Swychr...');
    
    // Get auth token first
    const authResponse = await axios.post('https://api.accountpe.com/api/payin/admin/auth', {
      email: process.env.SWYCHR_EMAIL,
      password: process.env.SWYCHR_PASSWORD
    });

    console.log('Swychr auth response:', {
      status: authResponse.status,
      data: authResponse.data
    });

    if (authResponse.data.status !== 200) {
      throw new Error(`Failed to authenticate with Swychr: ${authResponse.data.message || 'Unknown error'}`);
    }

    const authToken = authResponse.data.token;
    console.log('Authentication successful, token received');

    // Create payment link
    const paymentData = {
      country_code: 'US',
      name: 'DigiNum User',
      email: 'user@diginum.com', // You can make this dynamic
      mobile: '+1234567890', // You can make this dynamic
      amount: amount,
      transaction_id: `diginum_${Date.now()}`,
      description: description,
      pass_digital_charge: true
    };

    console.log('Creating payment link with data:', paymentData);

    const paymentResponse = await axios.post('https://api.accountpe.com/api/payin/create_payment_links', paymentData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Payment creation response:', {
      status: paymentResponse.status,
      data: paymentResponse.data
    });

    if (paymentResponse.data.status !== 200) {
      throw new Error(`Failed to create payment link: ${paymentResponse.data.message || 'Unknown error'}`);
    }

    // Extract payment URL from response
    const paymentUrl = paymentResponse.data.data?.payment_url || paymentResponse.data.data?.url;

    if (!paymentUrl) {
      throw new Error('No payment URL received from Swychr');
    }

    console.log('Payment link created successfully:', paymentUrl);

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
    console.error('Swychr payment error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to create payment link',
        details: error.response?.data || 'No additional details'
      })
    };
  }
};
