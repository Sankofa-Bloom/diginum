const axios = require('axios');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    
    // Validate required fields
    const { country_code, name, email, amount, transaction_id, description, pass_digital_charge } = requestBody;
    
    if (!country_code || !name || !email || !amount || !transaction_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: country_code, name, email, amount, transaction_id'
        })
      };
    }

    // For now, create a mock payment link since we don't have AccountPe credentials
    // In production, this would call the actual AccountPe API
    const mockPaymentUrl = `https://payment.accountpe.com/pay/${transaction_id}`;
    
    // Simulate API response
    const mockResponse = {
      success: true,
      data: {
        payment_url: mockPaymentUrl,
        transaction_id: transaction_id,
        status: 'pending'
      },
      status: 200,
      message: 'Payment link created successfully'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockResponse)
    };

  } catch (error) {
    console.error('Error creating payment link:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
