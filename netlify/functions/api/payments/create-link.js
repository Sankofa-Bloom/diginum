const axios = require('axios');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    
    // Validate required fields based on AccountPe API requirements
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

    // Prepare request for AccountPe API
    const accountPeRequest = {
      country_code,
      name,
      email,
      mobile: requestBody.mobile || '',
      amount: Math.round(amount), // Ensure amount is an integer
      transaction_id,
      description: description || `Payment for transaction ${transaction_id}`,
      pass_digital_charge: pass_digital_charge || false
    };

    console.log('Creating payment link with AccountPe API:', accountPeRequest);

    try {
      // Call AccountPe API to create payment link
      const accountPeResponse = await axios.post(
        'https://api.accountpe.com/api/payin/create_payment_links',
        accountPeRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            // Add authentication if required
            // 'Authorization': `Bearer ${process.env.ACCOUNTPE_API_KEY}`
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('AccountPe API response:', accountPeResponse.data);

      if (accountPeResponse.data && accountPeResponse.data.status === 200) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              payment_url: accountPeResponse.data.data?.payment_url || accountPeResponse.data.data?.url,
              transaction_id: transaction_id,
              status: 'pending'
            },
            status: accountPeResponse.data.status,
            message: accountPeResponse.data.message || 'Payment link created successfully'
          })
        };
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: accountPeResponse.data?.message || 'Failed to create payment link',
            status: accountPeResponse.data?.status || 400
          })
        };
      }

    } catch (apiError) {
      console.error('AccountPe API error:', apiError.response?.data || apiError.message);
      
      // If AccountPe API is not available, fall back to mock response for development
      if (process.env.NODE_ENV === 'development' || process.env.TEST_MODE === 'true') {
        console.log('Falling back to mock response for development/testing');
        
        const mockPaymentUrl = `https://payment.accountpe.com/pay/${transaction_id}`;
        const mockResponse = {
          success: true,
          data: {
            payment_url: mockPaymentUrl,
            transaction_id: transaction_id,
            status: 'pending'
          },
          status: 200,
          message: 'Payment link created successfully (mock)'
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(mockResponse)
        };
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Payment service temporarily unavailable',
          error: apiError.response?.data?.message || apiError.message
        })
      };
    }

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
