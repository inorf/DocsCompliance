"use client";

import React, { useState, useEffect } from "react";
import styles from "../styles/group.module.scss";
import UserProfile from '../../app/session/UserProfile';

const toPlainText = (value, fallback = '') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if ('user_name' in value) return value.user_name || fallback;
    if ('email' in value) return value.email || fallback;
  }
  return String(value);
};

export default function UserGroup() {
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(UserProfile.getAdmin());

  const fetchMembers = async (email) => {
    try {
      const res = await fetch('/api/auth/group-users', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email }) 
      });
      const payload = await res.json();
      
      if (payload.success && Array.isArray(payload.data)) {
        setMembers(payload.data.map((u, i) => ({ 
          id: i + 1, 
          name: u.user_name, 
          email: u.email, 
          joined: u.joined_at || '-', 
          admin: u.admin 
        })));
      } else {
        setMembers([]);
      }
    } catch (e) {
      console.error('fetchMembers', e);
      setMembers([]);
    }
  };

  const fetchRequests = async (email) => {
    try {
      const res = await fetch('/api/group/requests', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email }) 
      });
      const payload = await res.json();
      
      if (payload.success && Array.isArray(payload.data)) {
        const normalized = payload.data.map((r, idx) => {
          const name = toPlainText(r.user_name, 'Unknown');
          const emailValue = toPlainText(r.email, '');
          const note = toPlainText(r.note, '');
          const id = emailValue || `req-${idx}`;
          return { id, name, email: emailValue, note, status: r.status };
        });
        setRequests(normalized);
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.error('fetchRequests', e);
      setRequests([]);
    }
  };

  useEffect(() => {
    const email = UserProfile.getEmail();
    if (!email) return;
    
    setIsAdmin(UserProfile.getAdmin()); // Set admin status
    setLoading(true);
    Promise.all([fetchMembers(email), fetchRequests(email)])
      .finally(() => setLoading(false));
  }, []);

  const handleRequestAction = async (userEmail, agree) => {
    const adminEmail = UserProfile.getEmail();
    setError(""); // Clear previous errors
    
    try {
      const res = await fetch('/api/group/consent', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userEmail, agree }) 
      });
      
      const payload = await res.json();
      
      if (payload.success) {
        // Refresh both members and requests
        await fetchMembers(adminEmail);
        await fetchRequests(adminEmail);
      } else {
        setError(payload.error || `Failed to ${agree ? 'accept' : 'reject'} request`);
      }
    } catch (e) {
      console.error('Request action failed:', e);
      setError(`Failed to ${agree ? 'accept' : 'reject'} request`);
    }
  };

  const acceptRequest = (userEmail) => handleRequestAction(userEmail, true);
  const rejectRequest = (userEmail) => handleRequestAction(userEmail, false);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.main}>
          <div className={styles.loading}>Loading group data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.cardHeader}>
          <div className={styles.kicker}>Group</div>
          <h3>Team members</h3>
          <p className={styles.subtitle}>Manage members for your workspace.</p>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {isAdmin && (
          <div className={styles.toolbar}>
            <button 
              className={styles.btn} 
              onClick={() => setShowRequests(s => !s)}
            >
              {showRequests ? 'Hide join requests' : `Show join requests (${requests.length})`}
            </button>
          </div>
        )}

        {isAdmin && showRequests && (
          <div className={styles.requestsPanel} role="region" aria-label="Join requests">
            {requests.length === 0 ? (
              <div className={styles.empty}>No pending requests</div>
            ) : (
              requests.map(r => (
                <div key={r.id} className={styles.requestItem}>
                  <div className={styles.requestInfo}>
                    <div className={styles.reqName}>{r.name}</div>
                    <div className={styles.reqEmail}>{r.email}</div>
                    {r.note && <div className={styles.reqNote}>{r.note}</div>}
                  </div>
                  <div className={styles.requestActions}>
                    <button className={styles.acceptBtn} onClick={() => acceptRequest(r.email)}>
                      Accept
                    </button>
                    <button className={styles.rejectBtn} onClick={() => rejectRequest(r.email)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="3" className={styles.empty}>
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((m, i) => (
                  <tr key={i}>
                    <td>{m.name}</td>
                    <td className={styles.break}>{m.email}</td>
                    <td>{m.admin ? 'Admin' : 'Member'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}