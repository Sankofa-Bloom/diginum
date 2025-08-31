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
    
    // Validate required fields
    const { transaction_id } = requestBody;
    
    if (!transaction_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing required field: transaction_id'
        })
      };
    }

    console.log('Checking payment status for transaction:', transaction_id);

    try {
      // Call AccountPe API to check payment status
      const accountPeResponse = await axios.post(
        'https://api.accountpe.com/api/payin/payment_link_status',
        { transaction_id },
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
              status: accountPeResponse.data.data?.status || 'pending',
              amount: accountPeResponse.data.data?.amount || 0,
              currency: accountPeResponse.data.data?.currency || 'USD',
              transaction_id: transaction_id
            },
            status: accountPeResponse.data.status,
            message: accountPeResponse.data.message || 'Payment status retrieved successfully'
          })
        };
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: accountPeResponse.data?.message || 'Failed to get payment status',
            status: accountPeResponse.data?.status || 400
          })
        };
      }

    } catch (apiError) {
      console.error('AccountPe API error:', apiError.response?.data || apiError.message);
      
      // If AccountPe API is not available, fall back to mock response for development
      if (process.env.NODE_ENV === 'development' || process.env.TEST_MODE === 'true') {
        console.log('Falling back to mock response for development/testing');
        
        const mockStatus = {
          success: true,
          data: {
            status: 'completed', // Mock completed status
            amount: 10000, // Mock amount in cents
            currency: 'USD',
            transaction_id: transaction_id
          },
          status: 200,
          message: 'Payment status retrieved successfully (mock)'
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(mockStatus)
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
    console.error('Error checking payment status:', error);
    
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
