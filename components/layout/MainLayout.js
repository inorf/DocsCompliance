import React, { useEffect, useState } from "react";
import UserProfile from '../../app/session/UserProfile';
import Link from 'next/link';
import "../styles/MainLayout.scss";
// import { getGroup } from "../api/group";

const MainLayout = ({ children, userEmail }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    const fetchGroupName = async () => {
      try {
        const group = await getGroup(userEmail);
        if (group.success) {
          setGroupName(group.data.group_name);
        } else {
          setGroupName("No Group");
        }
      } catch (error) {
        console.error("Error fetching group:", error);
        setGroupName("Error");
      }
    };

    if (userEmail) fetchGroupName();
  }, [userEmail]);

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
