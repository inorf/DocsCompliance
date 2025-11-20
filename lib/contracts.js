'use server'
import { getSupabaseAdmin } from './supabaseAdmin'
import { getGroupByEmail } from './group'
import { getUser } from './auth'
import { createDate } from './dates'

async function getAdmin(){ return getSupabaseAdmin() }

export async function uploadFile(file, userEmail) {
    try {
        const groupResult = await getGroupByEmail(userEmail)
        if (!groupResult.success || !groupResult.data) {
            throw new Error("User doesn't have a group")
        }

        const supabaseAdmin = await getAdmin()
        const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('email', userEmail)
        .single()

        if (userError) throw userError
        if (!userData) throw new Error("User not found")

        const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.type)) throw new Error('Invalid file type. Only TXT, PDF, and DOCX are allowed.')

        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            throw new Error('File size must be less than 10MB')
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${groupResult.data.group_id}/${fileName}`

        const { error: uploadError } = await supabaseAdmin.storage
        .from('contracts')
        .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: publicData } = await supabaseAdmin.storage
        .from('contracts')
        .getPublicUrl(filePath)
        const publicUrl = publicData?.publicUrl || null

        const { data: contract, error: dbError } = await supabaseAdmin
        .from('contracts')
        .insert([
            {
                group_id: groupResult.data.group_id,
                file_path: filePath,
                file_url: publicUrl,
                file_name: file.name,
                uploaded_by: userData.user_id
            }
        ])
        .select()
        .single()

        if (dbError) throw dbError

        return { 
            success: true, 
            cont_id: contract.cont_id,
            file_name: file.name,
            file_url: publicUrl,
            error: null
        }

    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function setConMetadata(cont_id, metadata) {
    try {
        //const {cont_name, cont_details, start_date, end_date} = metadata
        const supabaseAdmin = await getAdmin()
        const {data: checkData, error: checkError} = await supabaseAdmin
        .from('contracts_metadata')
        .select('status')
        .eq('cont_id', cont_id)
        .single()

        if(checkError && checkError.code !== 'PGRST116') throw checkError

        if(!checkData){
            const metadataData = { cont_id:cont_id, ...metadata }
            const {error: insertError} = await supabaseAdmin
            .from('contracts_metadata')
            .insert([metadataData])
            
            if(insertError) throw insertError
        } else{
            const metadataData = { ...metadata, last_updated: new Date().toISOString() }
            const {error: updateError} = await supabaseAdmin
            .from('contracts_metadata')
            .update([metadataData])
            .eq("cont_id", cont_id)
            
            if(updateError) throw updateError
        }

        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }       
}

export async function getContracts(email) {
    try {
        const groupResult = await getGroupByEmail(email)
        if(!groupResult.success || !groupResult.data) throw new Error("User don't have group")
        
        const supabaseAdmin = await getAdmin()
    const {data: checkData, error: checkError} = await supabaseAdmin
    .from('contracts')
    .select(`
    cont_id,
    file_url,
    file_name,
    uploaded_at,
    name:users!contracts_uploaded_by_fkey(user_name),
    email:users!contracts_uploaded_by_fkey(email),
    contracts_metadata(cont_name, cont_details, start_date, end_date, status, last_updated),
    contracts_dates(dates(date_id, date_title, date_details, due_date, status, deadline_days, email:users!dates_assigned_to_fkey(email), name:users!dates_assigned_to_fkey(user_name)))
    `)
    .eq('group_id', groupResult.data.group_id)
    .order('uploaded_at', { ascending: false })
        
        if(checkError) throw checkError

        return{success:true, data:checkData || [], error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }    
}

export async function deleteContract(cont_id, email) {
    try {
        const userCheck = await getUser(email)
        if(!userCheck.success || !userCheck.data || !userCheck.data.admin) throw new Error("Access denied")

        const supabaseAdmin = await getAdmin()
        const {data:contract, error:checkError} = await supabaseAdmin
        .from('contracts')
        .select('file_path')
        .eq('cont_id', cont_id)
        .eq('group_id', userCheck.data.group_id)
        .single()

        if(checkError) throw checkError
        if(!contract) throw new Error("Contract not found")

        const {error: deleteMetadataErr} = await supabaseAdmin.from('contracts_metadata').delete().eq('cont_id', cont_id)
        if(deleteMetadataErr) throw deleteMetadataErr

        const {error: deleteDatesErr} = await supabaseAdmin.from('contracts_dates').delete().eq('cont_id', cont_id)
        if(deleteDatesErr) throw deleteDatesErr

        const {error: deleteError} = await supabaseAdmin.from('contracts').delete().eq('cont_id', cont_id)
        if(deleteError) throw deleteError

        const { error: storageError } = await supabaseAdmin.storage
        .from('contracts')
        .remove([contract.file_path])

        if(storageError) throw storageError
        
        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }    
}

export async function createConDates(cont_id, dates) {
    try {
        const createdDateIds = []
        
        for (const date of dates) {
            const checkCreate = await createDate(date)
            if(!checkCreate.success) {
                // Rollback: delete any dates we created so far
                if (createdDateIds.length > 0) {
                    const supabaseAdmin = await getAdmin()
                    await supabaseAdmin.from('dates').delete().in('date_id', createdDateIds)
                }
                throw new Error(checkCreate.error)
            }
            
            createdDateIds.push(checkCreate.data.date_id)
            
            const supabaseAdmin = await getAdmin()
            const { error: insertError } = await supabaseAdmin
            .from('contracts_dates')
            .insert([{cont_id:cont_id, date_id:checkCreate.data.date_id}])

            if(insertError) {
                // Rollback on link failure
                await supabaseAdmin.from('dates').delete().eq('date_id', checkCreate.data.date_id)
                await supabaseAdmin.from('dates').delete().in('date_id', createdDateIds.slice(0, -1))
                throw insertError
            }
        }
        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}
