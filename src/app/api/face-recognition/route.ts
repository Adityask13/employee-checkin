import { NextRequest, NextResponse } from 'next/server';

const FACE_RECOGNITION_API_URL = 'https://mbnd853n12.execute-api.us-east-2.amazonaws.com/default/search_faces_by_image';

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

    // Forward the request to the AWS Lambda face recognition API
    const response = await fetch(FACE_RECOGNITION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: body.image_base64
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Face recognition API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Face recognition API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the face recognition result
    return NextResponse.json(data);
  } catch (error) {
    console.error('Face recognition proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
