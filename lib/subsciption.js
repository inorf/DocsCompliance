'use server'
import { getUser } from "./auth";
import { getSupabaseAdmin } from "./supabaseAdmin";

async function getAdmin() {
    return getSupabaseAdmin()
}

export async function subscriptionOfGroup(email) {
  try {
    if (!email) throw new Error("No email provided");
    const user = await getUser(email);
    if (!user.success) throw new Error("User retrieval failed: " + user.error);
    if (!user.data) throw new Error("User not found");

    const supabaseAdmin = await getAdmin();
    const { data:subData, error:subError } = await supabaseAdmin
    .from('group')
    .select('subscription')
    .eq('group_id', user.data.group_id)
    .single();

    if (subError) throw subError;
    if (!subData || !subData.subscription) throw new Error("No subscription data found");

    return{success:true, data:subData, error: null}
  } catch (error) {
    return{success:false, error: error.message}
  }
}

export async function updateSubscription(admin_email, subscriptionData) {
    try {
        if (!admin_email) throw new Error("No email provided");
        if (!subscriptionData) throw new Error("No subscription data provided");
        const supabaseAdmin = await getAdmin();

        const user = await getUser(admin_email);
        if (!user.success) throw new Error("User retrieval failed: " + user.error);
        if (!user.data) throw new Error("User not found");
        if (!user.data.admin) throw new Error("Only admins can update subscription");

        const { error: updateError } = await supabaseAdmin
        .from('group')
        .update({ subscription: subscriptionData })
        .eq('group_id', user.data.group_id);
        
        if (updateError) throw updateError;
        
        return{success:true, error: null}
    } catch (error) {
        return{success:false, error: error.message}
    }
} //trial, premium, none

export async function subscriptionAccess(email) {
  try {
    if (!email) throw new Error("No email provided");
    
    const user = await getUser(email);
    if (!user.success) throw new Error("User retrieval failed: " + user.error);
    if (!user.data) throw new Error("User not found");
    
    const group_id = user.data.group_id;
    const supabaseAdmin = await getAdmin();
    const { data: groupData, error: groupError } = await supabaseAdmin
    .from('groups')
    .select('subscription, created_at')
    .eq('group_id', group_id)
    .single();

    if (groupError) throw groupError;

    if (!groupData || !groupData.subscription) throw new Error("No subscription data found");
    const subscription = groupData.subscription;
    if (subscription === 'none') {
      return{success:true, access: false, error: null} // Access is blocked
    } else if (subscription === 'trial') {
      const trialPeriodDays = 14;
      const createdAt = new Date(groupData.created_at);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - createdAt);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > trialPeriodDays) {
        const { error: updateError } = await supabaseAdmin
        .from('groups')
        .update({ subscription: 'none' })
        .eq('group_id', group_id);

        if (updateError) throw updateError;
        return{success:true, access: false, error: null} // Trial expired, access blocked
      } else {
        return{success:true, access: true, error: null} // Trial valid, access allowed
      }
    } else {
      return{success:true, access: true, error: null} // Paid subscription, access allowed
    }
  } catch (error) {
    return{success:false, error: error.message}
  }
}