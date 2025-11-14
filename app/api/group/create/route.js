import { NextResponse } from 'next/server'
import { createGroup } from '../../../../lib/group'
import { getUser } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { email, groupName } = await request.json()
    if (!email || !groupName) {
      return NextResponse.json({ success: false, error: 'Email and groupName are required' }, { status: 400 })
    }

    // Validate that the user exists and is authenticated (server-side verification)
    const userData = await getUser(email)
    if (!userData.success) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const result = await createGroup(email, groupName)
    
    if (!result.success) {
      console.error('Create group failed for email:', email, 'Error:', result.error)
      return NextResponse.json({ success: false, error: 'Failed to create group' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: { group_name: groupName } })
  } catch (error) {
    console.error('Create group API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
