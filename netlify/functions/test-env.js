const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Get all relevant environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      TEST_MODE: process.env.TEST_MODE,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET ? 'SET' : 'NOT_SET',
      PORT: process.env.PORT,
      // Check if we can access the function context
      function_name: context.functionName,
      function_version: context.functionVersion,
      request_id: context.awsRequestId
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Environment variables test completed',
        environment_variables: envVars,
        timestamp: new Date().toISOString(),
        function_name: 'test-env',
        test_status: 'OK'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to complete environment test',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
