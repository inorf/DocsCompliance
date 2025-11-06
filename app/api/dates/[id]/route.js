import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getGroup } from '@/lib/group'

export async function GET(request) {
    try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const groupResult = await getGroup(email)
    if (!groupResult.success) {
      return NextResponse.json(
        { success: false, error: groupResult.error.message },
        { status: 400 }
      )
    }

    const groupId = groupResult.data

    let query = supabase
      .from('dates')
      .select(`
        *,
        users!dates_assigned_to_fkey(user_id, user_name, email)
      `)
      .eq('group_id', groupId)

    const { data: dates, error } = await query.order('due_date', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      data: dates 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
