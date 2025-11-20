"use client"
import Mstyle from "../styles/group.module.css";
import Link from 'next/link';
import { useState, useEffect } from "react";

export default function Join() {
  const [Email, setEmail] = useState({email: ""});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState(null); // Track which request is being deleted

  // Check for existing pending requests when component loads
  useEffect(() => {
    checkPendingRequests();
  }, []);

  const checkPendingRequests = async () => {
    try {
      const res = await fetch('/api/group/pending-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Handle both single request and array of requests
        const requests = Array.isArray(data.data) ? data.data : [data.data];
        setPendingRequests(requests.filter(req => req !== null));
      }
    } catch (error) {
      console.error('Error checking pending requests:', error);
    }
  };

  const handleChange = (e) => {
    setEmail(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    
    try {
      const joinRes = await fetch('/api/group/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: Email.email })
      }).then(r => r.json());

      if (!joinRes.success) throw new Error(joinRes.error || 'Join failed');

      setErrorMsg(null);
      alert('Join request sent! Wait for admin approval.');
      setEmail({ email: '' });
      await checkPendingRequests(); // Refresh pending requests status
    } catch (error) {
      console.error('Join failed:', error);
      setErrorMsg(error.message || 'Failed to send join request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (adminEmail) => {
    setDeletingRequest(adminEmail); // Track which request is being deleted
    try {
      const deleteRes = await fetch('/api/group/delete-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail }) // Send specific admin email
      }).then(r => r.json());

      if (!deleteRes.success) throw new Error(deleteRes.error || 'Failed to delete request');

      // Remove the specific request from the list
      setPendingRequests(prev => prev.filter(req => 
        req.admin?.email !== adminEmail && req.admin_email !== adminEmail
      ));
      alert('Join request cancelled.');
    } catch (error) {
      console.error('Delete failed:', error);
      setErrorMsg(error.message || 'Failed to cancel request');
    } finally {
      setDeletingRequest(null);
    }
  };

  // Show only first 2 requests initially, show all when toggled
  const displayedRequests = showAllRequests 
    ? pendingRequests 
    : pendingRequests.slice(0, 2);

  return (
    <div className={Mstyle.page}>
      <div className={Mstyle.main}>
        <div className={Mstyle.cardHeader}>
          <p className={Mstyle.kicker}>Join group</p>
          <h3>Send your request to the admin</h3>
          <p className={Mstyle.subtitle}>
            Enter the email address of the group administrator and we will notify
            them instantly.
          </p>
        </div>

        <form className={Mstyle.connForm} onSubmit={handleJoin} aria-live="polite">
          <div className={Mstyle.mail}>
            <input 
              id="adminEmail"
              placeholder="Type a connection e-mail" 
              type="email"
              name="email"
              value={Email.email}
              onChange={handleChange}
              required
              aria-required="true"
              disabled={loading}
            />
            <img src="/icon/mail_Icon.png" alt="Mail icon" className={Mstyle.mailIcon} />
          </div>
          <button type="submit" className={Mstyle.submitButton} disabled={loading}>
            {loading ? 'Sending request…' : 'Send request'}
          </button>
          {errorMsg && (
            <div role="alert" className={Mstyle.statusMessage}>
              {errorMsg}
            </div>
          )}
        </form>

        {/* Show pending requests under the form */}
        {pendingRequests.length > 0 && (
          <div className={Mstyle.requestsSection}>
            <h4 className={Mstyle.requestsTitle}>
              Your Pending Requests ({pendingRequests.length})
            </h4>
            
            {displayedRequests.map((request) => {
              const adminEmail = request.admin?.email || request.admin_email;
              const isDeleting = deletingRequest === adminEmail;
              
              return (
                <div key={adminEmail} className={Mstyle.pendingRequest} role="status">
                  <div className={Mstyle.pendingInfo}>
                    <strong>Request to {adminEmail || 'Admin'}</strong>
                    <p>Status: <span className={`
                      ${Mstyle.status} 
                      ${request.status === 'accepted' ? Mstyle.statusAccepted : ''}
                    `}>{request.status}</span></p>
                    <p className={Mstyle.requestDate}>
                      Sent on: {new Date(request.created_at || request.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className={Mstyle.cancelButton}
                    onClick={() => handleDeleteRequest(adminEmail)}
                    disabled={isDeleting || loading}
                  >
                    {isDeleting ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              );
            })}

            {/* Show "Show more/less" toggle if there are more than 2 requests */}
            {pendingRequests.length > 2 && (
              <button 
                type="button"
                className={Mstyle.toggleRequests}
                onClick={() => setShowAllRequests(!showAllRequests)}
              >
                {showAllRequests ? 'Show Less' : `Show All ${pendingRequests.length} Requests`}
              </button>
            )}
          </div>
        )}

        <div className={Mstyle.createLink}>
          <p className={Mstyle.helperText}>
            Want to create a new group? <Link href="/create">Start from scratch</Link>
          </p>
        </div>
      </div>
    </div>
  );
}