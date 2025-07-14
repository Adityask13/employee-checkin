import { NextRequest, NextResponse } from 'next/server';

const AWS_PHOTO_UPLOAD_API_URL = 'https://dgraqymxui.execute-api.us-east-2.amazonaws.com/default/uploadEmployeePhoto';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.image_base64) {
      return NextResponse.json(
        { error: 'Missing required field: image_base64' },
        { status: 400 }
      );
    }

    if (!body.upload_key) {
      return NextResponse.json(
        { error: 'Missing required field: upload_key' },
        { status: 400 }
      );
    }

    // Forward the request to the AWS Lambda photo upload API
    const response = await fetch(AWS_PHOTO_UPLOAD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: body.image_base64,
        upload_key: body.upload_key,
        bucket: body.bucket || "orgemployees"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Photo upload API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Photo upload API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the photo upload result
    return NextResponse.json(data);
  } catch (error) {
    console.error('Photo upload proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
