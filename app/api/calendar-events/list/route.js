import { NextResponse } from 'next/server'
import { getDates, normalizeDeadlineDays } from '@/lib/dates'
import { getSession } from '@/lib/session'

export async function POST(request) {
  try {
    const session = await getSession();
    const user = session.user;

    if (!user || !user.isLoggedIn) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getDates(user.email)
    if (!result.success) return NextResponse.json(result, { status: 500 })

    // map dates -> calendar event shape expected by client
    const mapped = (result.data || []).map(d => ({
      event_id: d.date_id,
      event_name: d.date_title,
      event_description: d.date_details,
      event_date: d.due_date,
      event_color: d.event_color ? d.event_color : null,
      deadline_days: normalizeDeadlineDays(d.deadline_days),
      // include original fields in case UI needs them
      ...d
    }))

    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    console.error('getCalendarEvents error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}