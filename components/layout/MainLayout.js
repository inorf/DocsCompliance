"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import UserProfile from '../../app/session/UserProfile';
import Link from 'next/link';
import "../styles/MainLayout.scss";
// import { getGroup } from "../api/group";

const MainLayout = ({ children, userEmail }) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Centralized auth check for pages that use MainLayout
  useEffect(() => {
    const checkAuth = async () => {
      const email = UserProfile.getEmail();
      if (!email) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const authData = await res.json();
        if (!authData.authenticated) {
          router.push('/login');
          return;
        }

        if (!authData.hasGroup) {
          router.push('/join');
          return;
        }
      } catch (error) {
        console.error('Auth check failed (MainLayout):', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="layout">
      <header className="topbar">
        <button
          className="menu-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? "Close" : "Menu"}
        </button>
        <h1 className="app-title">{UserProfile.getGName() || "Loading..."}</h1>
      </header>

      <div className="body">
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <nav>
            <Link href="/mainPage"><p>Dashboard</p></Link>
            <Link href="/userProfile"><p>{UserProfile.getName() || UserProfile.getEmail()}'s Profile</p></Link>
            <Link href="/group"><p>Group</p></Link>
            <Link href="/settings"><p>Settings</p></Link>
          </nav>
        </aside>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
