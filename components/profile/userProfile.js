"use client";

import React, { useState, useEffect } from "react";
import "../styles/ProfileCard.scss";
import UserProfile from "../../app/session/UserProfile";

// placeholder activity until we fetch real timeline


export default function UserProfileCard() {
  const [name, setName] = useState("Unnamed member");
  const [email, setEmail] = useState("no-email@unknown.com");
  const [groupName, setGroupName] = useState("No group assigned");
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    const updateProfile = () => {
      setName(UserProfile.getName() || "Unnamed member");
      setEmail(UserProfile.getEmail() || "no-email@unknown.com");
      setGroupName(UserProfile.getGName() || "No group assigned");
    };

    // Initial update
    updateProfile();

    // Listen for storage changes (when session is restored in another tab)
    const handleStorageChange = () => {
      updateProfile();
    };
    window.addEventListener('storage', handleStorageChange);

    // Set up interval to check for profile changes (for when session is restored)
    const interval = setInterval(updateProfile, 500);

    // fetch recent timeline (last 5 contract uploads)
    const fetchTimeline = async () => {
      try {
        const userEmail = UserProfile.getEmail();
        if (!userEmail) return;
        const res = await fetch('/api/contracts/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail }) });
        const payload = await res.json();
        if (payload.success && Array.isArray(payload.data)) {
          const items = payload.data.slice(0,5).map(c => ({ title: (c.contracts_metadata && c.contracts_metadata.cont_name) || c.file_name, meta: c.uploaded_at ? new Date(c.uploaded_at).toLocaleString() : '' }));
          setTimeline(items);
        }
      } catch (e) {
        console.error('fetchTimeline', e);
      }
    };
    fetchTimeline();

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "DC";

  const handleLogout = () => {
    UserProfile.clearSession();
    window.location.href = "/login";
  };

  return (
    <section className="profile-shell">
      <header className="profile-hero">
        <div className="profile-hero__avatar">{initials}</div>
        <div>
          <p className="profile-hero__eyebrow">Profile overview</p>
          <h2>{name}</h2>
          <p>DocsCompliance member</p>
        </div>
        <div className="profile-hero__meta">
          <span>{groupName}</span>
          <small>current group</small>
        </div>
      </header>

      <div className="profile-grid">
        <article className="profile-card profile-card--form">
          <h3>Contact details</h3>
          <div className="input-row">
            <label>Name</label>
            <input name="name" value={name} readOnly />
          </div>

          <div className="input-row">
            <label>Email</label>
            <input name="email" value={email} readOnly />
          </div>

          <div className="profile-card__logout">
            <button type="button" className="ghost" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </article>

        <article className="profile-card profile-card--activity">
          <h3>Recent activity</h3>
          <ul>
            {timeline.length === 0 ? (
              <li className="muted">No recent activity</li>
            ) : (
              timeline.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
