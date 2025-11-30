import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const session = await getSession();
    const user = session.user;

    if (!user || !user.isLoggedIn) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await getSupabaseAdmin();
    
    // Get admin user_id
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    // Get all trusted users for this admin
    const { data: trustedUsers, error: listError } = await supabaseAdmin
      .from('trusted_users')
      .select(`
        user_id,
        users!trusted_users_user_id_fkey (
          email,
          user_name
        )
      `)
      .eq('admin_id', adminData.id);

    if (listError) {
      return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
    }

    const formattedUsers = (trustedUsers || []).map(tu => ({
      email: tu.users?.email || '',
      name: tu.users?.user_name || 'Unknown'
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('List trusted users error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

