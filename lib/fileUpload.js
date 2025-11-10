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
            data: contract,
            file_path: filePath,
            file_url: publicUrl,
            error: null
        }

    } catch (error) {
        return { success: false, error: error.message }
    }
}

/*  File {
    size: 1024,           // File size in bytes
    type: 'image/jpeg',   // MIME type
    name: 'photo.jpg',    // Original filename
    lastModified: 1635781234567, // Timestamp
    [Symbol(kState)]: { ... }
}*/