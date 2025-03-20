import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, phone } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      // API key is missing
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Use direct API endpoint for Brevo
    const url = 'https://api.brevo.com/v3/contacts';
    const options = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: name,
          PHONE: phone
        },
        updateEnabled: false
      })
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      // API error occurred
      throw new Error('Failed to add contact to Brevo');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error occurred during form submission
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}