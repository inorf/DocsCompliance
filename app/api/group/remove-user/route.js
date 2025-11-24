import { NextResponse } from 'next/server'
import { remoeveUserFromGroup } from '@/lib/group'
import { getSession } from '@/lib/session'

export async function POST(request) {
  try {
    const session = await getSession();
    const user = session.user;

    if (!user || !user.isLoggedIn) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail } = await request.json()
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'userEmail is required' }, { status: 400 })
    }

    await remoeveUserFromGroup(userEmail, user.email)
    return NextResponse.json({ success: true, error: null })
  } catch (error) {
    console.error('joinGroup error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}