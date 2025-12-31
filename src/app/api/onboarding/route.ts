import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Parse the JSON request body
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      "companyName",
      "industry",
      "employeeCount",
      "contactName",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "state",
      "zipCode",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contactEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // Basic phone validation
    const phoneDigits = data.contactPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid phone number with at least 10 digits",
        },
        { status: 400 },
      );
    }

    // Here you would typically:
    // 1. Store it in a database
    // 2. Maybe trigger email notifications or other processes

    // For demonstration, we're just returning success
    // In a real app, you'd store this data somewhere
    return NextResponse.json({
      success: true,
      message: "Onboarding data received successfully",
    });
  } catch (error) {
    // Error processing data
    console.error("Onboarding form submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process onboarding data" },
      { status: 500 },
    );
  }
}
