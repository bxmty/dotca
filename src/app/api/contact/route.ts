import { NextResponse } from "next/server";
import { isPossiblePhoneNumber, parsePhoneNumber } from "libphonenumber-js";

function isMissingOrString(value: unknown): value is string | undefined {
  return value === undefined || value === null || typeof value === "string";
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

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
      isWaitlist,
    } = body ?? {};

    // Reject non-string values up front so they surface as 400s, not 500s
    const stringFields = {
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
    };
    for (const [field, value] of Object.entries(stringFields)) {
      if (!isMissingOrString(value)) {
        return NextResponse.json(
          { error: `Field "${field}" must be a string` },
          { status: 400 },
        );
      }
    }

    // Determine full name based on input
    const fullName =
      name ||
      (firstName && lastName ? `${firstName} ${lastName}` : firstName || "");

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // More robust phone validation and formatting
    let formattedPhone = "";
    try {
      // Default to US if no country code is provided
      const phoneInput = phone.startsWith("+")
        ? phone
        : `+1${phone.replace(/\D/g, "")}`;

      // Check if it's a valid phone number
      if (!isPossiblePhoneNumber(phoneInput)) {
        return NextResponse.json(
          { error: "Please enter a valid phone number" },
          { status: 400 },
        );
      }

      // Format according to E.164 standard which Brevo expects
      const parsedPhone = parsePhoneNumber(phoneInput);
      formattedPhone = parsedPhone.format("E.164");
    } catch {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
        { status: 400 },
      );
    }

    // The Brevo key is a secret: only ever read the server-side variable
    // (a NEXT_PUBLIC_ fallback would invite bundling the key into client JS)
    const activeKey = process.env.BREVO_API_KEY;

    if (!activeKey) {
      // API key is missing
      console.error("Missing BREVO_API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error - missing API key" },
        { status: 500 },
      );
    }

    // Use direct API endpoint for Brevo
    const url = "https://api.brevo.com/v3/contacts";
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": activeKey,
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FULLNAME: fullName,
          FIRSTNAME: firstName || fullName.split(" ")[0] || "",
          LASTNAME:
            lastName ||
            (fullName.split(" ").length > 1
              ? fullName.split(" ").slice(1).join(" ")
              : ""),
          PHONE: phone,
          COMPANY: company || "",
          ADDRESS: address || "",
          CITY: city || "",
          STATE: state || "",
          ZIP: zip || "",
          PLAN_NAME: plan || "",
          BILLING_CYCLE: billingCycle || "",
          EMPLOYEE_COUNT: employeeCount ? employeeCount.toString() : "",
          IS_WAITLIST: isWaitlist ? "Yes" : "No",
          SMS: formattedPhone, // Add SMS attribute in attributes as well
        },
        // Use list ID 9 for contact form and list ID 10 for waitlist form
        listIds: [isWaitlist ? 10 : 9],
        // Add SMS field for brevo to send text messages
        smtpBlacklistSender: undefined, // Needed for SMS to work properly
        sms: {
          SMS: formattedPhone,
        },
        updateEnabled: true, // Allow updating existing contacts
      }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      // Try to get error details from the API response; keep the parse
      // attempt isolated so errors thrown below aren't swallowed by it
      let errorData: { code?: string; message?: string } | null = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      console.error("Brevo API error:", errorData ?? response.status);

      // Handle authentication errors
      if (response.status === 401 || errorData?.code === "unauthorized") {
        console.error("Brevo API key is not valid or not enabled");
        return NextResponse.json(
          {
            error:
              "Service temporarily unavailable. Please contact us directly at hi@boximity.ca or (289) 539-0098.",
          },
          { status: 503 },
        );
      }

      // Handle common error cases
      if (errorData?.code === "duplicate_parameter") {
        return NextResponse.json({
          success: true,
          message:
            "Your information has already been submitted. We will contact you soon.",
        });
      }

      // Handle phone number specific errors
      if (
        errorData?.code === "invalid_parameter" &&
        errorData.message?.toLowerCase().includes("phone")
      ) {
        return NextResponse.json(
          {
            error:
              "The provided phone number format is not valid. Please use a standard format like +1XXXXXXXXXX.",
          },
          { status: 400 },
        );
      }

      throw new Error(
        errorData
          ? `Brevo API error: ${errorData.message || JSON.stringify(errorData)}`
          : `Failed to add contact to Brevo (Status: ${response.status})`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error occurred during form submission
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 },
    );
  }
}
