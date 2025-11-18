"use client";

import React, { useState } from "react";
import styles from "../styles/group.module.css";


export default function userGroup() {
    
  const [members, setMembers] = useState([
    { id: 1, name: "Alice Johnson", email: "alice@example.com", joined: new Date().toLocaleDateString() },
    { id: 2, name: "Bob Smith", email: "bob@example.com", joined: new Date().toLocaleDateString() },
  ]);

  const [form, setForm] = useState({ name: "", email: "" });

  const addMember = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    const next = {
      id: Date.now(),
      name: form.name,
      email: form.email,
      joined: new Date().toLocaleDateString(),
    };
    setMembers((prev) => [next, ...prev]);
    setForm({ name: "", email: "" });
  };

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.cardHeader}>
          <div className={styles.kicker}>Group</div>
          <h3>Team members</h3>
          <p className={styles.subtitle}>Manage members for your workspace. Add a member below to see them appear in the table.</p>
        </div>

        <form className={styles.connForm} onSubmit={addMember}>
          <div className={styles.inputWrapper}>
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>

          <div className={styles.inputWrapper}>
            <input
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.submitButton}>Add member</button>
          </div>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: `1px solid ${getComputedStyle(document.documentElement).getPropertyValue('--border') || '#e6eef0'}` }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Date joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{m.name}</td>
                  <td style={{ padding: '0.75rem 0.5rem', wordBreak: 'break-all' }}>{m.email}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{m.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}