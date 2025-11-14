import { NextResponse } from 'next/server'
import { getGroup, getGroupByEmail } from '../../../../lib/group'
import { getUser } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { groupId, email } = await request.json()

    if (groupId) {
      const result = await getGroup(groupId)
      return NextResponse.json(result)
    }

    if (email) {
      // Validate that the user exists and is authenticated
      const userData = await getUser(email)
      if (!userData.success) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
      }

      const result = await getGroupByEmail(email)
      return NextResponse.json(result)
    }

    return NextResponse.json({ success: false, error: 'groupId or email is required' }, { status: 400 })
  } catch (error) {
    console.error('getGroup error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
