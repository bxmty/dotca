import { NextResponse } from 'next/server';
import { isPossiblePhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

export async function POST(request: Request) {
  try {
    const { 
      name, 
      firstName,
      lastName,
      email, 
      phone, 
      company, 
      address, 
      city, 
      state, 
      zip, 
      plan,
      billingCycle,
      employeeCount,
      isWaitlist
    } = await request.json();

    // Determine full name based on input
    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || '');

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (!fullName) {
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
    
    // More robust phone validation and formatting
    let formattedPhone = '';
    try {
      // Default to US if no country code is provided
      const phoneInput = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
      
      // Check if it's a valid phone number
      if (!isPossiblePhoneNumber(phoneInput)) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number' },
          { status: 400 }
        );
      }
      
      // Format according to E.164 standard which Brevo expects
      const parsedPhone = parsePhoneNumber(phoneInput);
      formattedPhone = parsedPhone.format('E.164');
    } catch {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
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
          FULLNAME: fullName,
          FIRSTNAME: firstName || fullName.split(' ')[0] || '',
          LASTNAME: lastName || (fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : ''),
          PHONE: phone,
          COMPANY: company || '',
          ADDRESS: address || '',
          CITY: city || '',
          STATE: state || '',
          ZIP: zip || '',
          PLAN_NAME: plan || '',
          BILLING_CYCLE: billingCycle || '',
          EMPLOYEE_COUNT: employeeCount ? employeeCount.toString() : '',
          IS_WAITLIST: isWaitlist ? 'Yes' : 'No',
          SMS: formattedPhone // Add SMS attribute in attributes as well
        },
        // Use list ID 9 for contact form and list ID 10 for waitlist form
        listIds: [isWaitlist ? 10 : 9],
        // Add SMS field for brevo to send text messages
        smtpBlacklistSender: undefined, // Needed for SMS to work properly
        sms: {
          SMS: formattedPhone
        },
        updateEnabled: true // Allow updating existing contacts
      })
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to get error details from API response
      try {
        const errorData = await response.json();
        console.error('Brevo API error:', errorData);

        // Handle authentication errors
        if (response.status === 401 || errorData.code === 'unauthorized') {
          console.error('Brevo API key is not valid or not enabled');
          return NextResponse.json(
            { error: 'Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.' },
            { status: 503 }
          );
        }

        // Handle common error cases
        if (errorData.code === 'duplicate_parameter') {
          return NextResponse.json(
            {
              success: true,
              message: 'Your information has already been submitted. We will contact you soon.'
            }
          );
        }

        // Handle phone number specific errors
        if (errorData.code === 'invalid_parameter' &&
            errorData.message?.toLowerCase().includes('phone')) {
          return NextResponse.json(
            { error: 'The provided phone number format is not valid. Please use a standard format like +1XXXXXXXXXX.' },
            { status: 400 }
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