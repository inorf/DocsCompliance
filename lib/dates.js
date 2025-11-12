import { supabase } from "./supabase"
import { getGroup } from "./group"

export async function createDate(date) {
    try{
        //const { date_title, date_details, due_date, assigned_to, deadline_days } = dateData //assigned_to - email
        if (date.assigned_to) {
            const groupResult = await getGroup(assigned_to)
            if(!groupResult.success || !groupResult.data) throw new Error("User don't have group")

            const dateData = {group_id:groupResult.data.group_id, ...date}

            const {data:userData, error:userError} = await supabase
            .from('users')
            .select('user_id')
            .eq('email', assigned_to)
            .single()

            if(userError) throw userError
            if(!userData) throw new Error("Responsible user not found")

            dateData.assigned_to = userData.user_id
        }

        const { error: checkError } = await supabase
        .from('dates')
        .insert([dateData])

        if(checkError) throw checkError

        return{success:true, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

async function dateStatus(date_id, due_date=null, deadline_days=null) {
    try {
        const { data:dateData, error: checkError } = await supabase
        .from('dates')
        .select('due_date, status, deadline_days') //deadline_days > 0 !!!
        .eq('date_id', date_id)
        .single()

        if(checkError) throw checkError
        if(!dateData) throw new Error("No date found")
        if(dateData.status=="completed") return { success: true, data: "completed" }

        let status = dateData.status

        if(due_date && deadline_days){
            const result = calculateStatus(due_date, deadline_days)
            status = result.success ? result.data : status
        } else{
            const result = calculateStatus(dateData.due_date, dateData.deadline_days)
            status = result.success ? result.data : status

            if (status != dateData.status) {
            const {error:updateError} = await supabase
            .from('dates')
            .update({ status: status })
            .eq('date_id', date_id)

            if(updateError) throw updateError
        }
        }

        return{success:true, data: status, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

function calculateStatus(due_date, deadline_days) {
    try {
        const oneDay = 24 * 60 * 60 * 1000;
        const nowDate = new Date()
        const dueDate = new Date(due_date)
        const diffInMilliseconds = dueDate.getTime() - nowDate.getTime();
        const days_before_due = Math.round(diffInMilliseconds / oneDay)+1;
        
        const status = days_before_due>deadline_days ? "pending" : (days_before_due>=0 ? "deadline" : "overdue") 

        return{success:true, data: status, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

export async function getDates(email) {
    try{
        const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, admin, group_id')
        .eq('email', email)
        .single()

        if(userError) throw userError
        if(!userData) throw new Error("User not found")
  
        let query = supabase
        .from('dates')
        .select('date_id, date_title, date_details, due_date, status, email:users!dates_assigned_to_fkey(email), name:users!dates_assigned_to_fkey(user_name)')
        
        if (userData.admin) {
            query = query.eq('group_id', userData.group_id)
        } else {
            query = query.eq('assigned_to', userData.user_id)
        }

        query = query.order('due_date', { ascending: true })

        const { data: dates, error: datesError } = await query

        if (datesError) throw datesError
        if (!dates) throw new Error("No dates found")

        const newDateData = await Promise.all(
            dates.map(async (date) => {
                const statusResult = await dateStatus(date.date_id)
                return {
                    ...date,
                    status: statusResult.success ? statusResult.data : date.status,
                    email: date.email,
                    name: date.name
                }
            })
        )

        return{success:true, data:newDateData, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

async function access(email, date_id) {
    try {
        const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, admin, group_id')
        .eq('email', email)
        .single()

        if(userError) throw userError
        if (!userData) throw new Error("User not found")

        const { data: accessDate, error:accessError } = await supabase
        .from('dates')
        .select('group_id, assigned_to, deadline_days')
        .eq('date_id', date_id)
        .single()

        if(accessError) throw accessError
        if(!accessDate) throw new Error("Date not found")
        const hasAccess = userData.admin ? accessDate.group_id === userData.group_id : accessDate.assigned_to === userData.user_id
        
        return{success:true, data:hasAccess, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}

export async function updateDate(email, date_id, update) {
    try {
        //const { date_title, date_details, due_date, assigned_to, deadline_days } = update //assigned_to - email
        const accessCheck = await access(email, date_id)
        if (!accessCheck.success || !accessCheck.data) {
            throw new Error("Access denied")
        }

        const updateData = { ...update }

        if (updateData.assigned_to) {
            const { data: userId, error: idError } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', updateData.assigned_to)
            .single()

            if(idError) throw idError
            if(!userId) throw new Error("Assigned user not found")
            updateData.assigned_to = userId.user_id
        }

        if (updateData.due_date) {
            const statusResult = await dateStatus(date_id, updateData.due_date, updateData.deadline_days ? updateData.deadline_days : accessDate.deadline_days)
            if (statusResult.success) updateData.status = statusResult.data
        }

        const { data:updatedDate, error:updateError } = await supabase
        .from('dates')
        .update(updateData)
        .eq('date_id', date_id)
        .select('date_id, date_title, date_details, due_date, status, deadline_days, email:users!dates_assigned_to_fkey(email), name:users!dates_assigned_to_fkey(user_name)')
        .single()

        if (updateError) throw updateError
        
        return{success:true, data:updatedDate, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}

export async function deleteDate(email, date_id) {
    try {
        const accessCheck = await access(email, date_id)
        if (!accessCheck.success || !accessCheck.data) {
            throw new Error("Access denied")
        }
        
        const { error:deleteConError } = await supabase
        .from('contracts_dates')
        .delete()
        .eq('date_id', date_id)

        if (deleteConError) throw deleteConError

        const { error:deleteError } = await supabase
        .from('dates')
        .delete()
        .eq('date_id', date_id)

        if (deleteError) throw deleteError
        
        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}