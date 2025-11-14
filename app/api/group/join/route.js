import { NextResponse } from 'next/server'
import { joinGroup } from '../../../../lib/group'
import { getUser } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { userEmail, adminEmail } = await request.json()
    if (!userEmail || !adminEmail) {
      return NextResponse.json({ success: false, error: 'userEmail and adminEmail are required' }, { status: 400 })
    }

    // Validate that the user exists and is authenticated (server-side verification)
    const userData = await getUser(userEmail)
    if (!userData.success) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const result = await joinGroup(userEmail, adminEmail)
    return NextResponse.json(result)
  } catch (error) {
    console.error('joinGroup error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
