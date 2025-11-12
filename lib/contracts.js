import { supabase } from './supabase'
import { getGroup } from './group'
import { getUser } from './auth'
import { createDate } from './dates'

export async function uploadFile(file, userEmail) {
    try {
        const groupResult = await getGroup(userEmail)
        if (!groupResult.success || !groupResult.data) {
            throw new Error("User doesn't have a group")
        }

        const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', userEmail)
        .single()

        if (userError) throw userError
        if (!userData) throw new Error("User not found")

        const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
        if (!allowedTypes.includes(file.type)) throw new Error('Invalid file type. Only TXT, PDF, DOC, and DOCX are allowed.')

        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            throw new Error('File size must be less than 10MB')
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${groupResult.data.group_id}/${fileName}`

        const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase
        .storage
        .from('contracts')
        .getPublicUrl(filePath)

        const { data: contract, error: dbError } = await supabase
        .from('contracts')
        .insert([
            {
                group_id: groupResult.data,
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
        const {data: checkData, error: checkError} = await supabase
        .from('contracts_metadata')
        .select('status')
        .eq('cont_id', cont_id)
        .single()

        if(checkError && checkError.code !== 'PGRST116') throw checkError

        if(!checkData){
            const metadataData = { cont_id:cont_id, ...metadata }
            const {error: insertError} = await supabase
            .from('contracts_metadata')
            .insert([metadataData])
            
            if(insertError) throw insertError
        } else{
            const metadataData = { ...metadata, last_updated: new Date().toISOString() }
            const {error: updateError} = await supabase
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
        const groupResult = await getGroup(email)
        if(!groupResult.success || !groupResult.data) throw new Error("User don't have group")
        
        const {data: checkData, error: checkError} = await supabase
        .from('contracts')
        .select(`
        cont_id,
        file_url,
        file_name,
        name:users!contracts_uploaded_by_fkey(user_name),
        email:users!contracts_uploaded_by_fkey(email),
        contracts_metadata(cont_name, cont_details, start_date, end_date, status, last_updated)
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

        const {data:contract, error:checkError} = await supabase
        .from('contracts')
        .select('file_path')
        .eq('cont_id', cont_id)
        .eq('group_id', userCheck.data.group_id)
        .single()

        if(checkError) throw checkError
        if(!contract) throw new Error("Contract not found")

        const {error: deleteMetadataErr} = await supabase.from('contracts_metadata').delete().eq('cont_id', cont_id)
        if(deleteMetadataErr) throw deleteMetadataErr

        const {error: deleteDatesErr} = await supabase.from('contracts_dates').delete().eq('cont_id', cont_id)
        if(deleteDatesErr) throw deleteDatesErr

        const {error: deleteError} = await supabase.from('contracts').delete().eq('cont_id', cont_id)
        if(deleteError) throw deleteError

        const { error: storageError } = await supabase.storage
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
        await Promise.all(
            dates.map(async (date) => {
                //const { date_title, date_details, due_date, assigned_to, deadline_days } = date | assigned_to - email(required)
                const checkCreate = await createDate(date)
                if(!checkCreate.success) throw new Error(checkCreate.error)

                const { error: insertError } = await supabase
                .from('contracts_dates')
                .insert([{cont_id:cont_id, date_id:checkCreate.data.date_id}])

                if(insertError) throw insertError
            })
        )
        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}