import { supabase } from './supabase'

export async function createGroup(email, group_name){
    try{
        const {data:group, error: insertError } = await supabase
        .from('groups')
        .insert([{group_name:group_name}])
        .select()
        .single()

        if(insertError) throw insertError

        const { error: updateError } = await supabase
        .from('users')
        .update({ group_id: group.group_id, admin:true })
        .eq('email', email)

        if(updateError) throw updateError
        return{success:true, error:null}
    } catch(error){
        return{success:false, error:error}
    }
}

export async function joinGroup(user_email, admin_email){
    try{
        const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('user_id, admin')
        .eq('email', admin_email)
        .single()

        if(adminError) throw adminError
        if(!adminData || !adminData.admin) throw new Error("Invalid email or user not a admin")
        
        const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', user_email)
        .single()

        if(userError) throw userError
        if(!userData) throw new Error("Invalid user email")

        const { error: insertError } = await supabase
        .from('join_requests')
        .insert([{admin_id: adminData.user_id, user_id: userData.user_id}])

        if(insertError) throw insertError

       return{success:true, error: null}
    } catch(error){
        return{success:false, error: error}
    }
}