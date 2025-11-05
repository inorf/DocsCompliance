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

export async function joinGroup(user_email, admin_email, group_code){
    try{
        const { data: adminData, error: checkError } = await supabase
        .from('users')
        .select('admin, group_id')
        .eq('email', admin_email)
        .single()

        if(checkError) throw checkError
        if(!adminData || !adminData.admin) throw new Error("Invalid email or user not a admin")
        
        //... will continue after changes in database
    } catch(error){

    }
}