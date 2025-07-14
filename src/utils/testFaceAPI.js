// Test script for face recognition API
// You can run this in the browser console to test the API

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const testFaceRecognitionAPI = async () => {
  const FACE_RECOGNITION_API = 'https://mbnd853n12.execute-api.us-east-2.amazonaws.com/default/search_faces_by_image';
  
  // Create a simple test image (1x1 pixel red image)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 1, 1);
  
  const testBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
  
  try {
    console.log('Testing Face Recognition API...');
    console.log('API URL:', FACE_RECOGNITION_API);
    
    const response = await fetch(FACE_RECOGNITION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: testBase64
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log('Expected format: { employee_id, similarity, sqs_message_id }');
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Network/CORS error:', error);
    console.log('💡 Make sure:');
    console.log('- API endpoint is correct');
    console.log('- CORS is configured for your domain');
    console.log('- API accepts the expected payload format');
  }
};

// Uncomment to run the test
// testFaceRecognitionAPI();

console.log('Face Recognition API test function loaded.');
console.log('Run testFaceRecognitionAPI() to test the API.');
