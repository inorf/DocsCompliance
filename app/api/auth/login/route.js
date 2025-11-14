import { NextResponse } from 'next/server'
import { login } from '../../../../lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }

    const result = await login(email, password)
    
    if (!result.success) {
      console.error('Login failed for email:', email, 'Error:', result.error)
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        name: result.name,
        admin: result.admin,
        group: result.group
      }
    })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
