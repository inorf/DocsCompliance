'use client'
import React, { useState, useEffect } from "react"
import "../styles/MainPage.scss"
//import UserProfile from "../../app/session/UserProfile"
import Link from "next/link"
import { useUserProfile } from '../context/UserProfileContext'

const stats = [
  { label: "Active contracts", value: "24", change: "+2 last week" },
  { label: "Pending reviews", value: "8", change: "-2 cases" },
  { label: "Expiring soon", value: "5", change: "Next 30 days" },
];

const reminders = [
  { title: "Vendor NDA refresh", due: "Tomorrow • 09:00", type: "legal" },
  { title: "SOC 2 audit prep", due: "Thu • 13:00", type: "security" },
  { title: "HR policy review", due: "Mon • 15:30", type: "policy" },
];

const timeline = [
  { time: "09:24", description: "Uploaded renewal contract for Globex" },
  { time: "11:02", description: "Requested signature from FinPay legal" },
  { time: "14:16", description: "Compliance check passed for vendor pack" },
  { time: "16:40", description: "Flagged clause mismatch on ACME draft" },
];

const documents = [
  { name: "ACME Procurement", status: "Draft", owner: "A. Hopkins" },
  { name: "Globex Security Addendum", status: "In review", owner: "R. Patel" },
  { name: "Q1 Vendor Audit", status: "Signed", owner: "M. Turner" },
];

export default function MainPage() {
  const { name, groupName, isLoaded } = useUserProfile();
  //const [displayName, setDisplayName] = useState("team");
  //const [groupName, setGroupName] = useState("your workspace");
  //const [isMounted, setIsMounted] = useState(false);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        <div>
          <p className="dashboard__eyebrow">Welcome back</p>
          <h2>Good day, {name.split(" ")[0]}!</h2>
          <p>
            You have {stats[1].value} reviews waiting and {stats[2].value} contracts
            expiring soon. Stay ahead of the queue for {groupName}.
          </p>
        </div>
        <div className="dashboard__cta">
          <button type="button" className="primary">Upload contract</button>
          <button type="button" className="secondary">Schedule briefing</button>
        </div>
      </section>

      <section className="dashboard__stats">
        {stats.map((item) => (
          <article key={item.label} className="stat-card">
            <p className="stat-card__label">{item.label}</p>
            <div className="stat-card__value">
              <span>{item.value}</span>
              {item.suffix && <small>{item.suffix}</small>}
            </div>
            <p className="stat-card__meta">{item.change}</p>
          </article>
        ))}
      </section>

      <section className="dashboard__grid">
        <article className="dashboard__panel dashboard__panel--wide">
          <header>
            <div>
              <p className="panel__eyebrow">Focus</p>
              <h3>Today's reminders</h3>
            </div>
            <Link href="/calendar">
              <button type="button">View calendar</button>
            </Link>
          </header>

          <ul className="reminders">
            {reminders.map((item) => (
              <li key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.due}</span>
                </div>
                <span className={`reminders__pill reminders__pill--${item.type}`}>
                  {item.type}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="dashboard__panel">
          <header>
            <div>
              <p className="panel__eyebrow">Recent activity</p>
              <h3>Timeline</h3>
            </div>
            <button type="button">See all</button>
          </header>

          <ul className="timeline">
            {timeline.map((item) => (
              <li key={item.time}>
                <span>{item.time}</span>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="dashboard__panel">
          <header>
            <div>
              <p className="panel__eyebrow">In progress</p>
              <h3>Documents</h3>
            </div>
            <button type="button">New record</button>
          </header>

          <div className="documents">
            {documents.map((doc) => (
              <div key={doc.name} className="documents__row">
                <div>
                  <strong>{doc.name}</strong>
                  <span>{doc.owner}</span>
                </div>
                <span className={`status status--${doc.status.replace(" ", "-").toLowerCase()}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}