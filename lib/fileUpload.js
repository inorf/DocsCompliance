import { supabase } from './supabase'
import { getGroup } from './group'

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
        const filePath = `${groupResult.data}/${fileName}`

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

export async function getContracts(email) {
    try {
        const groupResult = await getGroup(email)
        if(!groupResult.success || !groupResult.data) throw new Error("User don't have group")
        
        const {data: checkData, error: checkError} = await supabase
        .from("contracts")
        .select(`
        cont_id,
        file_url,
        file_name,
        name:users!contracts_uploaded_by_fkey(user_name),
        email:users!contracts_uploaded_by_fkey(email),
        contracts_metadata(cont_name, cont_details, start_date, end_date, status, last_updated)
        `)
        .eq('group_id', groupResult.data)
        .order('uploaded_at', { ascending: false })
        
        if(checkError) throw checkError

        return{success:true, data:checkData || [], error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }    
}