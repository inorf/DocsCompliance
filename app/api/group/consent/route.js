import { NextResponse } from 'next/server'
import { requestsConsent } from '../../../../lib/group'
import { getUser } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { userEmail, adminEmail, agree } = await request.json()
    if (!userEmail || !adminEmail || typeof agree !== 'boolean') {
      return NextResponse.json({ success: false, error: 'userEmail, adminEmail and agree(boolean) are required' }, { status: 400 })
    }

    // Validate that the user exists and is authenticated (server-side verification)
    const userData = await getUser(userEmail)
    if (!userData.success) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const result = await requestsConsent(userEmail, adminEmail, agree)
    return NextResponse.json(result)
  } catch (error) {
    console.error('requestsConsent error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
