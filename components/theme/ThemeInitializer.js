"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    // Apply theme on mount
    try {
      const storedTheme = localStorage.getItem('docscompliance_theme');
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

      if (storedTheme === 'light') {
        applyVars(LIGHT_VARS);
        root.setAttribute('data-theme', 'light');
      } else if (storedTheme === 'dark') {
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

  return null;
}

