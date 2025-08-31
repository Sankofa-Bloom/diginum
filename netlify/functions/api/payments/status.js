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

    // For now, return a mock status since we don't have AccountPe credentials
    // In production, this would call the actual AccountPe API
    const mockStatus = {
      success: true,
      data: {
        status: 'completed', // Mock completed status
        amount: 10000, // Mock amount in cents
        currency: 'USD',
        transaction_id: transaction_id
      },
      status: 200,
      message: 'Payment status retrieved successfully'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockStatus)
    };

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
