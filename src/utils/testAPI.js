// Test script to check API connectivity and CORS
// Run this in browser console to test the API

const testAPI = async () => {
  const API_URL = 'https://0uq172mu3k.execute-api.us-east-2.amazonaws.com/default/EmployeeLambdaHandler';
  
  try {
    console.log('Testing API connection...');
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Data received:', data);
    } else {
      console.error('API returned error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('CORS or Network error:', error);
    
    if (error.message.includes('CORS')) {
      console.log('🚨 CORS Issue: The Lambda function needs to return proper CORS headers');
    } else if (error.message.includes('fetch')) {
      console.log('🚨 Network Issue: Check if the API endpoint is accessible');
    }
  }
};

// Run the test
testAPI();
