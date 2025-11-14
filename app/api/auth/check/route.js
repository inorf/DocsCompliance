import { NextResponse } from 'next/server'
import { getUser } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ authenticated: false, hasGroup: false }, { status: 400 })
    }

    const userResult = await getUser(email)
    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ authenticated: false, hasGroup: false }, { status: 401 })
    }

    const { group_id, admin } = userResult.data
    const hasGroup = group_id !== null

    return NextResponse.json({
      authenticated: true,
      hasGroup,
      admin,
      groupId: group_id
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false, hasGroup: false }, { status: 500 })
  }
}
