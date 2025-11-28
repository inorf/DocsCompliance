import { updateAllContactDeadlineCounts } from "@/lib/dates";

export async function POST(request) {
  try {
    // Get the search params from the URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // Validate token
    const validToken = process.env.VALID_WEBHOOK_TOKENS;
    
    if (validToken!==token) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Update contact data
    const updateData = await updateAllContactDeadlineCounts();
    if (!updateData.success) {
      throw new Error('Failed to update contact counts, error: ' + updateData.error);
    }
    if (!updateData.data) {
      throw new Error('No data returned from updateAllContactDeadlineCounts');
    }

    return Response.json({ 
      success: true, 
      message: 'Contact counts updated successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}