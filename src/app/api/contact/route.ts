import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { 
      name, 
      email, 
      phone, 
      company, 
      address, 
      city, 
      state, 
      zip, 
      planName, 
      billingCycle, 
      employeeCount, 
      isWaitlist 
    } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Basic phone validation - allow different formats but ensure it has enough digits
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number with at least 10 digits' },
        { status: 400 }
      );
    }

    // Check for API key in various environments
    const apiKey = process.env.BREVO_API_KEY;
    const publicApiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY;
    const isProd = process.env.NODE_ENV === 'production';
    
    // In production, we must use the server-side API key
    // In development, we can fall back to the public key if needed
    const activeKey = isProd ? apiKey : (apiKey || publicApiKey);
    
    if (!activeKey) {
      // API key is missing
      console.error('Missing BREVO_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error - missing API key' },
        { status: 500 }
      );
    }
    
    // For debugging in development
    if (!isProd && !apiKey && publicApiKey) {
      console.warn('Using fallback NEXT_PUBLIC_BREVO_API_KEY - set BREVO_API_KEY for production');
    }

    // Use direct API endpoint for Brevo
    const url = 'https://api.brevo.com/v3/contacts';
    const options = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': activeKey
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: name,
          PHONE: phone,
          COMPANY: company || '',
          ADDRESS: address || '',
          CITY: city || '',
          STATE: state || '',
          ZIP: zip || '',
          PLAN_NAME: planName || '',
          BILLING_CYCLE: billingCycle || '',
          EMPLOYEE_COUNT: employeeCount ? employeeCount.toString() : '',
          IS_WAITLIST: isWaitlist ? 'Yes' : 'No'
        },
        // Use list ID 9 for contact form and list ID 10 for waitlist form
        listIds: [isWaitlist ? 10 : 9],
        // Add SMS field for brevo to send text messages - using object format with proper country code
        // Assuming US/Canada phone numbers (country code +1)
        // If phone doesn't already have a country code, add +1
        smtpBlacklistSender: undefined, // Needed for SMS to work properly
        sms: phone ? {
          SMS: phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
        } : undefined,
        updateEnabled: false
      })
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to get error details from API response
      try {
        const errorData = await response.json();
        console.error('Brevo API error:', errorData);
        
        // Handle common error cases
        if (errorData.code === 'duplicate_parameter') {
          return NextResponse.json(
            { 
              success: true, 
              message: 'Your information has already been submitted. We will contact you soon.' 
            }
          );
        }
        
        throw new Error(`Brevo API error: ${errorData.message || JSON.stringify(errorData)}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (parseError) {
        // If we can't parse the error JSON, use a generic error message
        throw new Error(`Failed to add contact to Brevo (Status: ${response.status})`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error occurred during form submission
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}