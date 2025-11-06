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

export async function getRequests(email){
    try{
        const { data: userData, error: checkError } = await supabase
        .from('users')
        .select('user_id, admin')
        .eq('email', email)
        .single()

        if(checkError) throw checkError
        if(!userData || !userData.admin) throw new Error("No access to group requests")
        
        const { data: userDatas, error: checkErrors } = await supabase
        .from('join_requests')
        .select('status, created_at, user_name:users!user_id(user_name), email:users!user_id(email)')
        .eq('admin_id', userData.user_id)

        if(checkErrors) throw checkErrors
        if(!userDatas) throw new Error("No group requests")
        
        return{success:true, data:userDatas, error: null}
    } catch(error){
        return{success:false, error: error}
    }
}

export async function requestsConsent(user_email, admin_email, agree){
    try{
            const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('user_id, group_id')
            .eq('email', admin_email)
            .single()

            if(adminError) throw adminError
            if(!adminData) throw new Error("Admin not found")

            const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', user_email)
            .single()

            if(userError) throw userError
            if (!userData) throw new Error("User not found")
            
        if(agree){
            const {error: updateError } = await supabase
            .from('users')
            .update({ group_id: adminData.group_id, admin:false })
            .eq('user_id', userData.user_id)

            if(updateError) throw updateError

            const {error: deleteError} = await supabase
            .from('join_requests')
            .delete()
            .eq('user_id',userData.user_id)
            .eq('admin_id',adminData.user_id)

            if(deleteError) throw deleteError
        } else{
            const { error: updateError } = await supabase
            .from('join_requests')
            .update({ status:'rejected'})
            .eq('user_id',userData.user_id)
            .eq('admin_id',adminData.user_id)

            if(updateError) throw updateError
        }
        return{success:true, error: null}
    } catch(error){
        return{success:false, error: error}
    }
}

export async function getGroup(email){
    try{
        const { data: userData, error: userError } = await supabase
        .from('users')
        .select('group_id')
        .eq('email', email)
        .single()

        if(userError) throw userError
        if(!userData) throw new Error("No user found")

        return{success:true, data: userData.group_id ,error: null}
    } catch(error){
        return{success:false, error: error}
    }
}