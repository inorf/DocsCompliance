import { NextResponse } from 'next/server'
import { requestsConsent } from '@/lib/group'
import { getSession } from '@/lib/session'

export async function POST(request) {
  try {
    const session = await getSession();
    const user = session.user;

    if (!user || !user.isLoggedIn) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, agree } = await request.json()
    if (!userEmail || typeof agree !== 'boolean') {
      return NextResponse.json({ success: false, error: 'userEmail and agree(boolean) are required' }, { status: 400 })
    }

    const result = await requestsConsent(userEmail, user.email, agree)
    return NextResponse.json(result)
  } catch (error) {
    console.error('requestsConsent error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}