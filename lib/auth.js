import bcrypt from 'bcryptjs'
import { supabase } from './supabase'
import { getGroup } from './group'

export async function signUp(name, email, password) {
    try{
        const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)

        if (checkError) throw checkError
        if (existingUsers && existingUsers.length > 0) throw new Error("Email already exists")
        
        const saltRounds = parseInt(process.env.SALT_ROUNDS)
        const hashPassword = await bcrypt.hash(password,saltRounds)

        const { error: insertError } = await supabase
        .from('users')
        .insert([{user_name:name, email: email, password: hashPassword}])

        if(insertError) throw insertError
        
        return{success:true, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }

}

export async function login(email, password) {
    try{
        const { data: userData, error: checkError } = await supabase
        .from('users')
        .select('user_name, email, password, admin, group_id')
        .eq('email', email)
        .single()
        
        if(checkError) throw checkError
        if(!userData) throw new Error("Invalid email or password")

        const check = await bcrypt.compare(password, userData.password)

        if(check){ 
            return{
            name:userData.user_name,
            success:true, 
            admin:userData.admin, 
            group:userData.group_id, 
            error:null
            }
        } else throw new Error("Invalid email or password")
    } catch(error){
        return{success:false, error: error.message}
    }
}

export async function getUser(email) {
    try{
        const { data: userData, error: checkError } = await supabase
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
        const groupResult = await getGroup(email)
        if(!groupResult.success || !groupResult.data) throw new Error("User don't have group")

        const { data: usersData, error: checkError } = await supabase
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