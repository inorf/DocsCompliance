import { NextResponse } from 'next/server'
import { createDate, normalizeDeadlineDays } from '@/lib/dates'
import { getSession } from '@/lib/session'

export async function POST(request) {
  try {
    const session = await getSession();
    const user = session.user;

    if (!user || !user.isLoggedIn) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { event } = await request.json()
    
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event object is required' }, { status: 400 })
    }

    // map incoming event -> date shape
    const deadlineDays = normalizeDeadlineDays(event.deadline_days)
    const datePayload = {
      date_title: event.event_name,
      date_details: event.event_description,
      due_date: event.event_date,
      assigned_to: user.email,
      deadline_days: deadlineDays
    }

    const result = await createDate(datePayload)
    if (!result.success) return NextResponse.json(result, { status: 500 })

    // map created date back to calendar-event shape
    const d = result.data
    const mapped = {
      event_id: d.date_id,
      event_name: d.date_title,
      event_description: d.date_details,
      event_date: d.due_date,
      event_color: d.event_color ? d.event_color : null,
      ...d
    }

    return NextResponse.json({ success: true, data: mapped })
  } catch (error) {
    console.error('createCalendarEvent error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}