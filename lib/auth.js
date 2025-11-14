'use server'
import bcrypt from 'bcryptjs'
import { getGroup, getGroupByEmail } from './group'
import { getSupabaseAdmin } from './supabaseAdmin'

async function getAdmin() { return getSupabaseAdmin() }


export async function signUp(name, email, password) {
  try {
    const supabaseAdmin = await getAdmin()
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)

    if (checkError) throw checkError
    if (existingUsers && existingUsers.length > 0) throw new Error("Email already exists")
    
    const saltRounds = parseInt(process.env.SALT_ROUNDS)
    const hashPassword = await bcrypt.hash(password, saltRounds)

    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{
        user_name: name, 
        email: email, 
        password: hashPassword,
        admin: false,
        group_id: null
      }])

    if(insertError) throw insertError
    
    return { success: true, error: null }
  } catch(error) {
    return { success: false, error: error.message }
  }
} //checked in front

export async function login(email, password) {
    try{
        const supabaseAdmin = await getAdmin()
        const { data: userData, error: checkError } = await supabaseAdmin
        .from('users')
        .select('user_name, email, password, admin, group_id')
        .eq('email', email)
        .single()
        
        if (checkError) {
            if (checkError.code === 'PGRST116') throw new Error("Invalid email or password 1")
            throw checkError
        }
        if(!userData) throw new Error("Invalid email or password 2")

        const check = await bcrypt.compare(password, userData.password)

        const group = await getGroup(userData.group_id)
        if(check){ 
            const groupData = group.success ? group.data : { group_id: null, group_name: null }
            return{
            name:userData.user_name,
            success:true, 
            admin:userData.admin, 
            group:groupData, 
            error: group.success ? null : group.error
            }
        } else throw new Error("Invalid email or password 3")
    } catch(error){
        return{success:false, error: error.message}
    }
} //checked in front

export async function getUser(email) {
    try{
    const supabaseAdmin = await getAdmin()
    const { data: userData, error: checkError } = await supabaseAdmin
    .from('users')
        .select('user_name, admin, group_id')
        .eq('email', email)
        .single()
        
        if(checkError) throw checkError
        if(!userData) throw new Error("Invalid email or password")

        return{success:true, data:userData, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

export async function getGroupUsers(email) {
    try{
    const groupResult = await getGroupByEmail(email)
        if(!groupResult.success || !groupResult.data) throw new Error("User don't have group")

    const supabaseAdmin = await getAdmin()
    const { data: usersData, error: checkError } = await supabaseAdmin
    .from('users')
        .select('email, user_name, admin')
        .eq('group_id', groupResult.data.group_id)
        
        if(checkError) throw checkError
        if(!usersData) throw new Error("No users in the group")

        return{success:true, data:usersData, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}