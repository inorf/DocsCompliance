'use server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function assertServer() {
	if (typeof window !== 'undefined') {
		throw new Error('supabaseAdmin must only be used on the server')
	}
	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error('Missing Supabase server environment variables')
	}
}

export async function getSupabaseAdmin() {
	assertServer()
	return createClient(supabaseUrl, serviceRoleKey)
}