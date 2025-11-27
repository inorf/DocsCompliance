// app/api/brevo/identify-user/route.js
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getDeadlinesOverdueCounts } from '@/lib/dates';
import { subscriptionOfGroup } from '@/lib/subsciption';

export async function POST(request) {
  try {
    const session = await getSession();
    
    // Check if user is authenticated
    if (!session?.user?.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      );
    }

    // Check if Brevo API key is configured
    if (!process.env.BREVO_API_KEY) {
      console.error('Brevo API key not configured');
      return NextResponse.json(
        { success: false, error: 'Brevo integration not configured' },
        { status: 500 }
      );
    }

    // Get deadline counts with better error handling
    const daysResult = await getDeadlinesOverdueCounts(userEmail);
    const deadlineDays = daysResult.success ? (daysResult.data?.deadlineDays || 0) : 0;
    const overdueDays = daysResult.success ? (daysResult.data?.overdueDays || 0) : 0;

    if (!daysResult.success) {
      console.warn('Failed to get deadline counts, using defaults:', daysResult.error);
    }

    const firstName = session.user.name || '';
    const subResult = await subscriptionOfGroup(userEmail);
    let subscription = 'none';
    if (subResult.success && subResult.data && subResult.data.subscription) {
      subscription = subResult.data.subscription;
    } else {
      console.warn('Failed to get subscription info, defaulting to none:', subResult.error);
    }

    // Prepare Brevo contact data
    const brevoContactData = {
      email: userEmail,
      attributes: {
        FIRSTNAME: firstName,
        DEADLINE_COUNT: deadlineDays,
        OVERDUE_COUNT: overdueDays,
        SUBSCRIPTION: subscription,
        LAST_SYNC: new Date().toISOString(),
      },
      updateEnabled: true
    };

    console.log('Sending to Brevo:', { email: userEmail, deadlineDays, overdueDays });

    // Call Brevo API with timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brevoContactData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // ✅ FIXED: Handle empty or non-JSON responses
    let responseData;
    const responseText = await brevoResponse.text();
    
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse Brevo response as JSON:', responseText);
      responseData = { message: 'Invalid JSON response' };
    }

    if (!brevoResponse.ok) {
      console.error('Brevo API error:', {
        status: brevoResponse.status,
        statusText: brevoResponse.statusText,
        response: responseData
      });
      
      throw new Error(`Brevo API error (${brevoResponse.status}): ${responseData.message || brevoResponse.statusText}`);
    }

    console.log(`Brevo user sync successful for ${userEmail}`);

    return NextResponse.json({
      success: true,
      message: 'User identified in Brevo successfully',
      counts: { 
        deadlineDays, 
        overdueDays 
      },
      brevoId: responseData.id
    });

  } catch (error) {
    console.error('Brevo identify error:', error);
    
    // Handle specific error types
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Brevo API request timeout';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error - cannot reach Brevo API';
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}