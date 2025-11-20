'use server'
import { getSupabaseAdmin } from "./supabaseAdmin"

async function getAdmin() {
    return getSupabaseAdmin()
}

export async function createGroup(email, groupName){
    try{
        if(!email || !groupName) throw new Error("No given data")
        const supabaseAdmin = await getAdmin()
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
        
        const supabaseAdmin = await getAdmin()
        
        // Get admin data
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('users')
            .select('user_id, admin')
            .eq('email', admin_email)
            .single()

        if(adminError) throw adminError
        if(!adminData || !adminData.admin) throw new Error("Invalid email or user is not an admin")
        
        // Get user data
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('email', user_email)
            .single()

        if(userError) throw userError
        if(!userData) throw new Error("Invalid user email")

        // Check if user is trying to join their own group
        if(userData.user_id === adminData.user_id) {
            throw new Error("You cannot send a join request to yourself")
        }

        // Check for existing requests
        const { data: existingRequest, error: checkError } = await supabaseAdmin
            .from('join_requests')
            .select('status')
            .eq('user_id', userData.user_id)
            .eq('admin_id', adminData.user_id)
            .maybeSingle()

        if(checkError) throw checkError

        // Handle different cases of existing requests
        if(existingRequest) {
            if(existingRequest.status === 'pending') {
                throw new Error("You already have a pending request with this admin")
            } else if(existingRequest.status === 'accepted') {
                throw new Error("You are already a member of this admin's group")
            } else if(existingRequest.status === 'rejected') {
                throw new Error("Your previous request was rejected. Please contact the admin directly.")
            }
        }

        // Insert new join request
        const { error: insertError } = await supabaseAdmin
            .from('join_requests')
            .insert([{
                admin_id: adminData.user_id, 
                user_id: userData.user_id,
                status: 'pending'
            }])

        if(insertError) throw insertError

        return { success: true, error: null }
    } catch(error){
        return { success: false, error: error.message }
    }
}

export async function getRequests(email){
    try{
        const supabaseAdmin = await getAdmin()
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
        .neq('status', 'rejected')

        if(checkErrors) throw checkErrors
        if(!usersData) throw new Error("No group requests")
        
        return{success:true, data:usersData, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

export async function requestsConsent(user_email, admin_email, agree){
    try{
        const supabaseAdmin = await getAdmin()
        const { data: adminData, error: adminError } = await supabaseAdmin
        .from('users')
        .select('user_id, group_id, admin')
        .eq('email', admin_email)
        .single()

        if(adminError) throw adminError
        if(!adminData || !adminData.admin) throw new Error("Admin not found")

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
        const supabaseAdmin = await getAdmin()
        const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('email', email)
        .single()

        if(userError) throw userError

        const { data: userConsent, error: checkError } = await supabaseAdmin
        .from('join_requests')
        .select('status, updated_at, admin:users!join_requests_admin_id_fkey(email)')
        .eq('user_id', userData.user_id)

        if(checkError) throw checkError
        if(!userConsent || userConsent.length<=0) throw new Error("No pending consent found")

        return{success:true, data:userConsent, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}

export async function deleteConsent(userEmail, adminEmail) {
    try {
        const supabaseAdmin = await getAdmin()
        
        // Get the user_id of the person making the request
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('email', userEmail)
            .single()

        if(userError) throw userError

        // Get the admin_id of the target admin
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('email', adminEmail)
            .single()

        if(adminError) throw adminError

        // Delete the specific join request
        const { error: deleteError } = await supabaseAdmin
            .from('join_requests')
            .delete()
            .eq('user_id', userData.user_id)
            .eq('admin_id', adminData.user_id)

        if(deleteError) throw deleteError

        return { success: true, error: null }
    } catch (error) {
        return { success: false, error: error.message }
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

        const supabaseAdmin = await getAdmin()
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

export async function getGroupByEmail(email){
    try{
        if(!email) throw new Error("Email is required")
        const supabaseAdmin = await getAdmin()
        const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('group_id')
        .eq('email', email)
        .single()

        if (userError) throw userError
        if (!user || !user.group_id) {
            return { success:true, data:{ group_id: null, group_name: null }, error: null }
        }

        return await getGroup(user.group_id)
    } catch(error){
        return{success:false, error: error.message}
    }
}