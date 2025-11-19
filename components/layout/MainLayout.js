"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from 'next/navigation';
import UserProfile from '../../app/session/UserProfile';
import Link from 'next/link';
import "../styles/MainLayout.scss";

const navLinks = [
  { href: "/mainPage", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/contracts", label: "Contracts" },
  { href: "/userProfile", label: "Profile" },
  { href: "/group", label: "Group" },
  { href: "/settings", label: "Settings" },
];

const MainLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Add loading state

  const [displayName, setDisplayName] = useState("Loading…");
  const [groupName, setGroupName] = useState("Workspace");
  const [email, setEmail] = useState('—');
  const [showProfile, setShowProfile] = useState(false);

  // Centralized auth check for pages that use MainLayout
  useEffect(() => {
    const checkAuth = async () => {
      if (!UserProfile.getEmail() || !UserProfile.getIsLoggedIn()) {
      setIsCheckingAuth(true);
      
      try {
        // Sync with server first to get current session
        await UserProfile.syncWithServer()

        const currentEmail = UserProfile.getEmail();
        if (!currentEmail) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentEmail }),
        });

        const authData = await res.json();
        if (!authData.authenticated) {
          UserProfile.clearSession();
          router.push('/login');
          return;
        }

        if (!authData.hasGroup) {
          router.push('/join');
          return;
        }

        // Update profile data after successful auth
        setDisplayName(UserProfile.getName() || UserProfile.getEmail() || "User");
        setGroupName(UserProfile.getGName() || "Workspace");
        setEmail(UserProfile.getEmail() || '—');
        
      } catch (error) {
        console.error('Auth check failed (MainLayout):', error);
        UserProfile.clearSession();
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    } else {
      setIsCheckingAuth(false);
    }
    };
    
    checkAuth();
  }, [router, pathname]); // Added pathname to re-check on route changes

  // Update display name and group name when profile changes
  useEffect(() => {
    const updateProfile = () => {
      setDisplayName(UserProfile.getName() || UserProfile.getEmail() || "User");
      setGroupName(UserProfile.getGName() || "Workspace");
      setEmail(UserProfile.getEmail() || '—');
    };

    // Update periodically (reduce interval frequency)
    const interval = setInterval(updateProfile, 2000); // Reduced from 500ms to 2s
    
    // Also listen for storage changes
    const handleStorageChange = () => {
      updateProfile();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 1024px)");
    const syncSidebar = (event) => {
      const matches = event?.matches ?? mq.matches;
      setIsDesktop(matches);
      setIsSidebarOpen(matches);
    };

    syncSidebar();
    mq.addEventListener("change", syncSidebar);
    return () => mq.removeEventListener("change", syncSidebar);
  }, []);

  const handleSignOut = async () => {
    await UserProfile.logout(); // Use the proper logout method
    router.push("/login");
  };

  const toggleSidebar = () => {
    if (isDesktop) return;
    setIsSidebarOpen((prev) => !prev);
  };

  const collapseSidebarOnMobile = () => {
    if (isDesktop) return;
    setIsSidebarOpen(false);
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`layout ${isSidebarOpen && !isDesktop ? "layout--sidebar-open" : ""}`}>
      <aside className={`sidebar ${isSidebarOpen ? "sidebar--open" : ""}${isDesktop ? " sidebar--desktop" : ""}`}>
        <div className="sidebar__brand">
          <span className="sidebar__logo">DC</span>
          <div>
            <p className="sidebar__eyebrow">DocsCompliance</p>
            <h2>{groupName}</h2>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar__link ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={collapseSidebarOnMobile}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <button type="button" className="sidebar__logout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      {!isDesktop && isSidebarOpen && (
        <button
          type="button"
          className="layout__backdrop"
          aria-label="Close navigation overlay"
          onClick={collapseSidebarOnMobile}
        />
      )}

      <div className="layout__main">
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="topbar__breadcrumbs">
            <p className="topbar__eyebrow">Workspace overview</p>
            <h1>{groupName}</h1>
          </div>

          <div
            className="topbar__user"
            onMouseEnter={() => setShowProfile(true)}
            onMouseLeave={() => setShowProfile(false)}
            onFocus={() => setShowProfile(true)}
            onBlur={() => setShowProfile(false)}
            tabIndex={0}
            aria-haspopup="true"
            aria-expanded={showProfile}
          >
            <div className="topbar__user-meta">
              <span className="topbar__user-label">Signed in as</span>
              <strong>{displayName}</strong>
            </div>
            <div className="topbar__avatar">
              {displayName
                .split(" ")
                .map((chunk) => chunk[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div
              className={`profile-popup ${showProfile ? 'profile-popup--visible' : ''}`}
              role="dialog"
              aria-label="User profile"
              aria-hidden={!showProfile}
            >
              <div className="profile-popup__row">
                <div className="profile-popup__label">Name</div>
                <div className="profile-popup__value">{displayName}</div>
              </div>

              <div className="profile-popup__row">
                <div className="profile-popup__label">Email</div>
                <div className="profile-popup__value profile-popup__email">{email}</div>
              </div>

              <div className="profile-popup__row">
                <div className="profile-popup__label">Group</div>
                <div className="profile-popup__value">{groupName}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;