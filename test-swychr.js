// Simple test script for Swychr function
const axios = require('axios');

async function testSwychr() {
  try {
    console.log('Testing Swychr payment function...');
    
    const response = await axios.post('https://diginum.netlify.app/.netlify/functions/swychr-create-payment', {
      amount: 1000, // $10.00 in cents
      description: 'Test payment'
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testSwychr();
