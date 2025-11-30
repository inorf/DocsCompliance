// app/session/UserProfile
'use client';

let UserProfile = (function() {
  let user_name = "";
  let group_name = "";
  let user_email = "";
  let adminD = false;
  let isLoggedIn = false;

  const syncWithServer = async (retryCount = 3) => {
    try {
      const res = await fetch('/api/auth/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.isLoggedIn) {
        user_name = data.name || "";
        group_name = data.group?.group_name || "";
        user_email = data.email || "";
        adminD = data.admin || false;
        isLoggedIn = true;
        return { success: true, user: data };
      } else {
        clearSession();
        return { success: false, error: 'Not logged in' };
      }
    } catch (error) {
      console.error('Error syncing with server:', error);
      
      // Retry logic with exponential backoff
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 300 * (4 - retryCount)));
        return syncWithServer(retryCount - 1);
      }
      
      clearSession();
      return { success: false, error: error.message };
    }
  };

  // ... rest of your existing methods remain the same
  let getName = function() {
    return user_name;
  };

  let getAdmin = function() {
    return adminD;
  };

  let getGName = function() {
    return group_name;
  };

  let getEmail = function() {
    return user_email;
  };
  
  let getIsLoggedIn = function() {
    return isLoggedIn;
  };

  let clearSession = function() {
    user_name = "";
    group_name = "";
    user_email = "";
    adminD = false;
    isLoggedIn = false;
    // Clear Brevo identification status from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('brevo_identified');
    }
  };

  let setBrevoIdentified = function(value) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('brevo_identified', value ? 'true' : 'false');
    }
  };

  let getBrevoIdentified = function() {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('brevo_identified') === 'true';
    }
    return false;
  };

  let logout = async function() {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearSession();
    }
  };

  return {
    getName: getName,
    getAdmin: getAdmin,
    getGName: getGName,
    getEmail: getEmail,
    getIsLoggedIn: getIsLoggedIn,
    syncWithServer: syncWithServer,
    clearSession: clearSession,
    logout: logout,
    setBrevoIdentified: setBrevoIdentified,
    getBrevoIdentified: getBrevoIdentified
  }
})();

export default UserProfile;