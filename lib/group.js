'use server'
import { supabaseAdmin } from "./supabaseAdmin"

export async function createGroup(email, groupName){
    try{
        if(!email || !groupName) throw new Error("No given data")
        const {data:group, error: insertError } = await supabaseAdmin
        .from('groups')
        .insert([{group_name:groupName}])
        .select()
        .single()

        if(insertError) throw insertError

        const { data:userData, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ group_id: group.group_id, admin:true })
        .eq('email', email)
        .select()

        if(updateError) throw updateError
        if(!userData) throw new Error("User not updated")
        return{success:true, data:userData, error:null}
    } catch(error){
        return{success:false, error: error.message}
    }
} //checked in front

export async function joinGroup(user_email, admin_email){
    try{
        if(!user_email || !admin_email) throw new Error("No given data")
        const { data: adminData, error: adminError } = await supabaseAdmin
        .from('users')
        .select('user_id, admin')
        .eq('email', admin_email)
        .single()

        if(adminError) throw adminError
        if(!adminData || !adminData.admin) throw new Error("Invalid email or user not a admin")
        
        const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('email', user_email)
        .single()

        if(userError) throw userError
        if(!userData) throw new Error("Invalid user email")

        const { error: insertError } = await supabaseAdmin
        .from('join_requests')
        .insert([{admin_id: adminData.user_id, user_id: userData.user_id}])

        if(insertError) throw insertError

        return{success:true, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
} //checked in front

export async function getRequests(email){
    try{
        const { data: userData, error: checkError } = await supabaseAdmin
        .from('users')
        .select('user_id, admin')
        .eq('email', email)
        .single()

        if(checkError) throw checkError
        if(!userData || !userData.admin) throw new Error("No access to group requests")
        
        const { data: usersData, error: checkErrors } = await supabaseAdmin
        .from('join_requests')
        .select('status, created_at, user_name:users!join_requests_user_id_fkey(user_name), email:users!join_requests_user_id_fkey(email)')
        .eq('admin_id', userData.user_id)

        if(checkErrors) throw checkErrors
        if(!usersData) throw new Error("No group requests")
        
        return{success:true, data:usersData, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

export async function requestsConsent(user_email, admin_email, agree){
    try{
        const { data: adminData, error: adminError } = await supabaseAdmin
        .from('users')
        .select('user_id, group_id')
        .eq('email', admin_email)
        .single()

        if(adminError) throw adminError
        if(!adminData) throw new Error("Admin not found")

        const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('email', user_email)
        .single()

        if(userError) throw userError
        if (!userData) throw new Error("User not found")
            
        if(agree){
            const {error: updateError } = await supabaseAdmin
            .from('users')
            .update({ group_id: adminData.group_id, admin:false })
            .eq('user_id', userData.user_id)

            if(updateError) throw updateError

            const {error: deleteError} = await supabaseAdmin
            .from('join_requests')
            .delete()
            .eq('user_id', userData.user_id)
            .eq('admin_id', adminData.user_id)

            if(deleteError) throw deleteError
            return {success:true, data:adminData.group_id, error:null}
        } else{
            const { error: updateError } = await supabaseAdmin
            .from('join_requests')
            .update({ status:'rejected', updated_at: new Date().toISOString()})
            .eq('user_id', userData.user_id)
            .eq('admin_id', adminData.user_id)

            if(updateError) throw updateError
        }
        return{success:true, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
} //checked in front

export async function getConsent(email){
    try {
        const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('email', email)
        .single()

        if(userError) throw userError

        const { data: userConsent, error: checkError } = await supabaseAdmin
        .from('join_requests')
        .select('status, updated_at, admin:users!join_requests_admin_id_fkey(email)')
        .eq('admin_id', userData.user_id)

        if(checkError) throw checkError

        return{success:true, data:userConsent, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}

export async function getGroup(groupId){
    try{
        if(!groupId){
            return{
                success:true,
                data:{ group_id: null, group_name: null },
                error:null
            }
        }

        const {data:group, error: checkError } = await supabaseAdmin
        .from('groups')
        .select('group_name')
        .eq('group_id', groupId)
        .single()

        if(checkError) throw checkError
        if(!group) throw new Error("Group not found")

        return{success:true, data: {
                group_id: groupId,
                group_name: group.group_name
            }, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
} //checked in front