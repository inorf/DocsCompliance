"use client";
import React, { useState } from "react";
import Link from 'next/link';
import "../styles/ProfileCard.scss";
import UserProfile from '../../app/session/UserProfile';

export default function userProfile( userData ) {

  // default fallback data
  const [name, setName] = useState(UserProfile.getName() || "None");
  const [email, setEmail] = useState(UserProfile.getEmail() || "None");
  const [groupName] = useState(UserProfile.getGName() || "No Group");
  const [firmName] = useState("No Firm");
  const [image] = useState("/default-avatar.jpg");

  return (
    <div className="profile-card">
      {/* Profile Image */}
      <div className="profile-img">
        <img src={image} alt="Profile" />
      </div>

      {/* User Info */}
      <div className="profile-info">
        <div className="input-group">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Firm:</label>
          <input type="text" value={firmName} disabled />
        </div>

        <div className="input-group">
          <label>Group:</label>
          <input type="text" value={groupName} disabled />
        </div>

        <Link href="/login" onNavigate={(e) => {
            alert("You have been logged out.");
            UserProfile.setEmail("");
            UserProfile.setName("");
            UserProfile.setGName("");
            }}><button className="logout-btn">
          Log Out
        </button></Link>
      </div>
    </div>
  );
}
