"use client";

import React, { useState, useEffect, useCallback } from "react";
import "../styles/Settings.scss";
import UserProfile from "../../app/session/UserProfile";

export default function UserSettings() {
  const [themePreference, setThemePreference] = useState("system");
  const [message, setMessage] = useState(null);
  const [displayName, setDisplayName] = useState("your account");

  // ✅ SIMPLIFIED: Single useEffect for profile
  useEffect(() => {
    setDisplayName(UserProfile.getName() || UserProfile.getEmail() || "your account");
  }, []);

  // ✅ SIMPLIFIED: Load theme once on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('docscompliance_theme');
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        setThemePreference(storedTheme);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // ✅ OPTIMIZED: Theme application with useCallback
  const applyTheme = useCallback((theme) => {
    try {
      const root = document.documentElement;

      const DARK_VARS = {
        '--background': '#0b1220',
        '--foreground': '#ffffff',
        '--card': '#0f1724',
        '--card-foreground': '#ffffff',
        '--popover': '#0b1220',
        '--popover-foreground': '#ffffff',
        '--primary': '#000000',
        '--primary-foreground': '#ffffff',
        '--secondary': '#0b1220',
        '--secondary-foreground': '#ffffff',
        '--muted': '#0b1220',
        '--muted-foreground': '#9ca3af',
        '--accent': '#ffffff',
        '--accent-foreground': '#0b1220',
        '--destructive': '#dc2626',
        '--destructive-foreground': '#ffffff',
        '--border': '#1f2937',
        '--input': '#0b1220',
        '--ring': '#60a5fa',
      };

      const LIGHT_VARS = {
        '--background': '#ffffff',
        '--foreground': '#0b1220',
        '--card': '#f8fafc',
        '--card-foreground': '#0b1220',
        '--popover': '#ffffff',
        '--popover-foreground': '#0b1220',
        '--primary': '#0b1220',
        '--primary-foreground': '#ffffff',
        '--secondary': '#f1f5f9',
        '--secondary-foreground': '#0b1220',
        '--muted': '#f3f4f6',
        '--muted-foreground': '#6b7280',
        '--accent': '#0b1220',
        '--accent-foreground': '#ffffff',
        '--destructive': '#dc2626',
        '--destructive-foreground': '#ffffff',
        '--border': '#e6eef0',
        '--input': '#ffffff',
        '--ring': '#60a5fa',
      };

      const applyVars = (vars) => {
        Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
      };

      const clearVars = () => {
        Object.keys(DARK_VARS).forEach((k) => root.style.removeProperty(k));
        Object.keys(LIGHT_VARS).forEach((k) => root.style.removeProperty(k));
      };

      if (theme === 'light') {
        applyVars(LIGHT_VARS);
        root.setAttribute('data-theme', 'light');
      } else if (theme === 'dark') {
        applyVars(DARK_VARS);
        root.setAttribute('data-theme', 'dark');
      } else {
        clearVars();
        root.removeAttribute('data-theme');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // ✅ OPTIMIZED: Theme change handler
  const handleThemeChange = useCallback((newTheme) => {
    setThemePreference(newTheme);
    
    // Save to localStorage
    try {
      localStorage.setItem('docscompliance_theme', newTheme);
    } catch (e) {
      console.error('save theme', e);
    }
    
    // Apply theme immediately
    applyTheme(newTheme);
    
    // Show success message
    setMessage("Theme updated");
    setTimeout(() => setMessage(null), 2000);
  }, [applyTheme]);

  return (
    <section className="settings">
      <header className="settings__hero">
        <div>
          <p className="settings__eyebrow">Workspace settings</p>
          <h2>Control center</h2>
          <p>Customize appearance for {displayName}.</p>
        </div>
      </header>

      <div className="settings__grid">
        <article className="settings-card">
          <header>
            <h3>Appearance</h3>
            <p>Choose how DocsCompliance matches your system layout.</p>
          </header>

          <div className="settings-card__options">
            {["system", "light", "dark"].map((mode) => (
              <label key={mode} className={`option ${themePreference === mode ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="theme"
                  value={mode}
                  checked={themePreference === mode}
                  onChange={(e) => handleThemeChange(e.target.value)}
                />
                <span>{mode}</span>
              </label>
            ))}
          </div>
        </article>

        {message && (
          <div className="settings__message">
            {message}
          </div>
        )}
      </div>
    </section>
  );
}