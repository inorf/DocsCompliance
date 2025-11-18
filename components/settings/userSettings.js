"use client";

import React, { useState, useEffect } from "react";
import "../styles/Settings.scss";
import UserProfile from "../../app/session/UserProfile";

const defaultToggles = {
  weeklySummary: true,
  criticalAlerts: true,
  ndaReminders: false,
  productUpdates: true,
};

export default function UserSettings() {
  const [themePreference, setThemePreference] = useState("system");
  const [timezone, setTimezone] = useState("UTC");
  const [toggles, setToggles] = useState(defaultToggles);
  const [message, setMessage] = useState(null);
  const [displayName, setDisplayName] = useState("your account");

  useEffect(() => {
    const updateProfile = () => {
      setDisplayName(UserProfile.getName() || UserProfile.getEmail() || "your account");
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

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("Preferences updated");
    setTimeout(() => setMessage(null), 2000);
  };

  // Load stored theme preference on mount and sync across tabs
  useEffect(() => {
    try {
      const stored = localStorage.getItem('docscompliance_theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemePreference(stored);
      }
    } catch (e) {
      // ignore
    }

    const onStorage = (e) => {
      if (e.key === 'docscompliance_theme') {
        const val = e.newValue;
        if (val === 'light' || val === 'dark' || val === 'system') {
          setThemePreference(val);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Apply the theme preference by setting a data-theme attribute and inline CSS variables.
  useEffect(() => {
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

      if (themePreference === 'light') {
        localStorage.setItem('docscompliance_theme', 'light');
        applyVars(LIGHT_VARS);
        root.setAttribute('data-theme', 'light');
      } else if (themePreference === 'dark') {
        localStorage.setItem('docscompliance_theme', 'dark');
        applyVars(DARK_VARS);
        root.setAttribute('data-theme', 'dark');
      } else {
        localStorage.setItem('docscompliance_theme', 'system');
        clearVars();
        root.removeAttribute('data-theme');
      }
    } catch (e) {
      // ignore
    }
  }, [themePreference]);

  return (
    <section className="settings">
      <header className="settings__hero">
        <div>
          <p className="settings__eyebrow">Workspace settings</p>
          <h2>Control center</h2>
          <p>Fine-tune notifications, themes, and account data for {displayName}.</p>
        </div>
        <div className="settings__summary">
          <span>{timezone}</span>
          <small>current timezone</small>
        </div>
      </header>

      <form className="settings__grid" onSubmit={handleSubmit}>
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
                  onChange={(e) => setThemePreference(e.target.value)}
                />
                <span>{mode}</span>
              </label>
            ))}
          </div>
        </article>

        <article className="settings-card">
          <header>
            <h3>Notifications</h3>
            <p>Stay informed about deadlines and activity.</p>
          </header>

          <ul className="toggle-list">
            {Object.entries(toggles).map(([key, value]) => (
              <li key={key}>
                <div>
                  <strong>{key.replace(/([A-Z])/g, " $1")}</strong>
                  <span>Receive {key.toLowerCase()} via e-mail.</span>
                </div>
                <button
                  type="button"
                  className={`toggle ${value ? "is-on" : ""}`}
                  onClick={() => handleToggle(key)}
                >
                  <span />
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="settings-card">
          <header>
            <h3>Locale</h3>
            <p>Set when reminders hit your inbox.</p>
          </header>

          <label className="select">
            <span>Timezone</span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="UTC">UTC</option>
              <option value="EST">EST (GMT-5)</option>
              <option value="PST">PST (GMT-8)</option>
              <option value="CET">CET (GMT+1)</option>
            </select>
          </label>
        </article>

        <article className="settings-card settings-card--danger">
          <header>
            <h3>Danger zone</h3>
            <p>Delete cached profile data from this device.</p>
          </header>

          <button
            type="button"
            className="danger"
            onClick={() => {
              UserProfile.clearSession();
              setMessage("Local profile cleared");
            }}
          >
            Clear profile cache
          </button>
        </article>

        <div className="settings__actions">
          <button type="submit" className="primary">
            Save changes
          </button>
          {message && <span className="settings__message">{message}</span>}
        </div>
      </form>
    </section>
  );
}