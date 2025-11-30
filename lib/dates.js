'use server'
import { getSupabaseAdmin } from "./supabaseAdmin"
import { getGroupByEmail } from "./group"
import { getUser } from "./auth"
import { subscriptionAccess } from "./subsciption"

async function getAdmin(){ return getSupabaseAdmin() }

export async function createDate(date) {
    try{
        //const { date_title, date_details, due_date, assigned_to, deadline_days } = date | assigned_to - email(required)
        if (!date.assigned_to) throw new Error("Assigned user email is required")
        const subAccess = await subscriptionAccess(date.assigned_to)
        if(!subAccess.success) throw new Error("Subscription access check failed: " + subAccess.error)
        if(!subAccess.access) throw new Error("Subscription expired. Please contact admin to renew subscription.")

        if (date.deadline_days){
        if (date.deadline_days <= 0) throw new Error("Invalid deadline days")}

        const groupResult = await getGroupByEmail(date.assigned_to)
        if(!groupResult.success || !groupResult.data) throw new Error("User don't have group")

        const dateData = {group_id:groupResult.data.group_id, ...date}

        const supabaseAdmin = await getAdmin()
        const {data:userData, error:userError} = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('email', date.assigned_to)
        .single()

        if(userError) throw userError
        if(!userData) throw new Error("Responsible user not found")

        dateData.assigned_to = userData.user_id

        const { data:insertData, error: insertError } = await supabaseAdmin
        .from('dates')
        .insert([dateData])
        .select()
        .single()

        if(insertError) throw insertError

        return{success:true, data:insertData, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

async function dateStatus(date_id, due_date=null, deadline_days=null) {
    try {
        const supabaseAdmin = await getAdmin()
        const { data:dateData, error: checkError } = await supabaseAdmin
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
            const {error:updateError} = await supabaseAdmin
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
        nowDate.setHours(0, 0, 0, 0)
        const dueDate = new Date(due_date)
        dueDate.setHours(0, 0, 0, 0)
        const diffInMilliseconds = dueDate.getTime() - nowDate.getTime();
        const daysBeforeDue = Math.ceil(diffInMilliseconds / oneDay);
        
        let status = "pending"
        if (daysBeforeDue < 0) {
            status = "overdue"
        } else if (daysBeforeDue <= deadline_days) {
            status = "deadline"
        }

        return{success:true, data: status, error: null}
    } catch(error){
        return{success:false, error: error.message}
    }
}

export async function getDates(email) {
    try{
        const subAccess = await subscriptionAccess(email)
        if(!subAccess.success) throw new Error("Subscription access check failed: " + subAccess.error)
        if(!subAccess.access) throw new Error("Subscription expired. Please contact admin to renew subscription.")

        const supabaseAdmin = await getAdmin()
        const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('user_id, admin, group_id')
        .eq('email', email)
        .single()

        if(userError) throw userError
        if(!userData) throw new Error("User not found")
  
        let query = supabaseAdmin
        .from('dates')
        .select('date_id, date_title, date_details, due_date, status, deadline_days, email:users!dates_assigned_to_fkey(email), name:users!dates_assigned_to_fkey(user_name)')
        
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
        const supabaseAdmin = await getAdmin()
        const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('user_id, admin, group_id')
        .eq('email', email)
        .single()

        if(userError) throw userError
        if (!userData) throw new Error("User not found")

        const { data: accessDate, error:accessError } = await supabaseAdmin
        .from('dates')
        .select('group_id, assigned_to, deadline_days')
        .eq('date_id', date_id)
        .single()

        if(accessError) throw accessError
        if(!accessDate) throw new Error("Date not found")
        const hasAccess = userData.admin ? accessDate.group_id === userData.group_id : accessDate.assigned_to === userData.user_id

        return{success:true, data:{ hasAccess, accessDate }, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}

export async function updateDate(email, date_id, update) {
    try {
        //const { date_title, date_details, due_date, assigned_to, deadline_days } = update | assigned_to - email
        const subAccess = await subscriptionAccess(email)
        if(!subAccess.success) throw new Error("Subscription access check failed: " + subAccess.error)
        if(!subAccess.access) throw new Error("Subscription expired. Please contact admin to renew subscription.")

        const accessCheck = await access(email, date_id)
        if (!accessCheck.success || !accessCheck.data || !accessCheck.data.hasAccess) {
            throw new Error("Access denied")
        }
        if (update.deadline_days){
        if (update.deadline_days <= 0) throw new Error("Invalid deadline days")}

        const updateData = { ...update }

        const supabaseAdmin = await getAdmin()

        if (updateData.assigned_to) {
            const { data: userId, error: idError } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('email', updateData.assigned_to)
            .single()

            if(idError) throw idError
            if(!userId) throw new Error("Assigned user not found")
            updateData.assigned_to = userId.user_id
        }

        if (updateData.due_date) {
            let statusDeadline = updateData.deadline_days;
            // If no deadline_days in update, use existing from database
            if (statusDeadline === undefined) {
                statusDeadline = accessCheck.deadline_days;
            }
            
            // Validate we have a deadline_days value
            if (statusDeadline === undefined || statusDeadline === null) {
                throw new Error("deadline_days is required when updating due_date");
            }
            const statusResult = await dateStatus(date_id, updateData.due_date, statusDeadline)
            if (statusResult.success) updateData.status = statusResult.data
        }

        const { data:updatedDate, error:updateError } = await supabaseAdmin
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
        const subAccess = await subscriptionAccess(email)
        if(!subAccess.success) throw new Error("Subscription access check failed: " + subAccess.error)
        if(!subAccess.access) throw new Error("Subscription expired. Please contact admin to renew subscription.")

        const accessCheck = await access(email, date_id)
        if (!accessCheck.success || !accessCheck.data || !accessCheck.data.hasAccess) {
            throw new Error("Access denied")
        }
        const supabaseAdmin = await getAdmin()

        const { error:deleteConError } = await supabaseAdmin
        .from('contracts_dates')
        .delete()
        .eq('date_id', date_id)

        if (deleteConError) throw deleteConError

        const { error:deleteError } = await supabaseAdmin
        .from('dates')
        .delete()
        .eq('date_id', date_id)

        if (deleteError) throw deleteError
        
        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}

export async function completeDate(email, date_id) {
    try {
        const subAccess = await subscriptionAccess(email)
        if(!subAccess.success) throw new Error("Subscription access check failed: " + subAccess.error)
        if(!subAccess.access) throw new Error("Subscription expired. Please contact admin to renew subscription.")

        const supabaseAdmin = await getAdmin()
        const { data:userData, error:userError } = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('email', email)
        .single()
        if(userError) throw userError
        if(!userData) throw new Error("User not found")
        
        const { error:updateError } = await supabaseAdmin
        .from('dates')
        .update({ status: 'completed' })
        .eq('date_id', date_id)
        .eq('assigned_to', userData.user_id)

        if(updateError) throw updateError
        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}

export async function normalizeDeadlineDays(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }

  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }

  return 7
}

export async function getDeadlinesOverdueCounts(email) {
    try {
        const subAccess = await subscriptionAccess(email)
        if(!subAccess.success) throw new Error("Subscription access check failed: " + subAccess.error)
        if(!subAccess.access) throw new Error("Subscription expired. Please contact admin to renew subscription.")

        const supabaseAdmin = await getAdmin();
        
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('user_id')
            .eq('email', email)
            .single();

        if (userError) throw userError;
        if (!userData) throw new Error("User not found");

        const { count: deadlineCount, error: deadlineError } = await supabaseAdmin
            .from('dates')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', userData.user_id)
            .eq('status', 'deadline');

        if (deadlineError) throw deadlineError;

        const { count: overdueCount, error: overdueError } = await supabaseAdmin
            .from('dates')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', userData.user_id)
            .eq('status', 'overdue');

        if (overdueError) throw overdueError;

        return { 
            success: true, 
            data: { 
                deadlineDays: deadlineCount || 0, 
                overdueDays: overdueCount || 0 
            }, 
            error: null 
        };
        
    } catch (error) {
        console.error('getDeadlinesOverdueCounts error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateAllContactDeadlineCounts() {
    try {
        const supabaseAdmin = await getAdmin();
        
        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('user_id, email')
            
        if (usersError) throw usersError;
        
        const results = [];
        await updateDatesStatus();
        // Update each user's counts in Brevo
        for (const user of users) {
            const counts = await getDeadlinesOverdueCounts(user.email);
            const userData = await getUser(user.email);
            if (!userData.success) continue;
            
            const subAccess = await subscriptionAccess(user.email)
            if(!subAccess.access) continue;
            
            
            if (counts.success) {
                // Call Brevo API to update this user
                const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
                    method: 'POST',
                    headers: {
                        'api-key': process.env.BREVO_API_KEY,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.email,
                        attributes: {
                            FIRSTNAME: userData.data.user_name,
                            DEADLINE_COUNT: counts.data.deadlineDays,
                            OVERDUE_COUNT: counts.data.overdueDays,
                            LAST_BATCH_UPDATE: new Date().toISOString(),
                        },
                        updateEnabled: true
                    })
                });
                
                results.push({
                    email: user.email,
                    success: brevoResponse.ok,
                    name: userData.data.user_name,
                    deadlineCount: counts.data.deadlineDays,
                    overdueCount: counts.data.overdueDays
                });
            }
        }
        
        return { success: true, data:results, error: null}
        
    } catch (error) {
        console.error('updateAllContactDeadlineCounts error:', error);
        return { success: false, error: error.message };
    }
}

async function updateDatesStatus() {
    try {
        const supabaseAdmin = await getAdmin();
        
        const { data: dates, error: datesError } = await supabaseAdmin
        .from('dates')
        .select('date_id');
        if (datesError) throw datesError
        for (const date of dates) {
            await dateStatus(date.date_id);
        }
        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
}