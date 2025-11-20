'use client'
import React, { useState, useEffect } from "react"
import "../styles/MainPage.scss"
//import UserProfile from "../../app/session/UserProfile"
import Link from "next/link"
import { useUserProfile } from '../context/UserProfileContext'

const stats = [
  { label: "Active contracts", value: "0", change: "+0 last week" },
  { label: "Events", value: "0", change: "Upcoming" },
  { label: "Expiring soon", value: "0", change: "Next 30 days" },
];

// placeholders until data loads
const emptyReminders = [];
const emptyTimeline = [];
const emptyDocuments = [];

export default function MainPage() {
  const { name, groupName, isLoaded, email } = useUserProfile();
  const [contracts, setContracts] = useState([]);
  const [events, setEvents] = useState([]);
  const [docs, setDocs] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [addedLastWeek, setAddedLastWeek] = useState(0);
  //const [displayName, setDisplayName] = useState("team");
  //const [groupName, setGroupName] = useState("your workspace");
  //const [isMounted, setIsMounted] = useState(false);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    if (!email) return;

    async function loadData() {
      try {
        const cRes = await fetch('/api/contracts/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const cPayload = await cRes.json();
        const cData = (cPayload.success && Array.isArray(cPayload.data)) ? cPayload.data : [];
        setContracts(cData);

        // compute active
        const active = cData.filter(c => c.contracts_metadata && c.contracts_metadata.status === 'active').length;
        setActiveCount(active);

        // compute expiring soon (end_date within 30 days)
        const now = new Date();
        const in30 = new Date(); in30.setDate(now.getDate() + 30);
        const expiring = cData.filter(c => {
          const ed = c.contracts_metadata?.end_date;
          if (!ed) return false;
          const d = new Date(ed);
          return d >= now && d <= in30;
        }).length;
        setExpiringCount(expiring);

        // documents (PDFs)
        const pdfs = cData.filter(c => c.file_url && (c.file_name || '').toLowerCase().endsWith('.pdf'))
                          .map(c => ({ name: c.contracts_metadata?.cont_name || c.file_name, url: c.file_url }));
        setDocs(pdfs);

        // added last week
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
        const added = cData.filter(c => {
          if (!c.uploaded_at) return false;
          const u = new Date(c.uploaded_at);
          return u >= oneWeekAgo && u <= now;
        }).length;
        setAddedLastWeek(added);

        // fetch calendar events (dates)
        const dRes = await fetch('/api/dates/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const dPayload = await dRes.json();
        const dData = (dPayload.success && Array.isArray(dPayload.data)) ? dPayload.data : [];
        // show next few upcoming events
        const upcoming = dData.filter(ev => ev.due_date).sort((a,b)=> new Date(a.due_date) - new Date(b.due_date)).slice(0,5);
        setEvents(upcoming);

      } catch (e) {
        console.error('loadData', e);
      }
    }

    loadData();
  }, [email]);

  return (
    <div className="dashboard">
      <section className="dashboard__hero">
        <div>
          <p className="dashboard__eyebrow">Welcome back</p>
          <h2>Good day, {name.split(" ")[0]}!</h2>
          <p>
            You have {events.length} upcoming events and {expiringCount} contracts expiring soon. {addedLastWeek} contracts added last week for {groupName}.
          </p>
        </div>
        <div className="dashboard__cta">
          <Link href="/contracts"><button type="button" className="primary">Upload contract</button></Link>
          <button type="button" className="secondary">Schedule briefing</button>
        </div>
      </section>

      <section className="dashboard__stats">
        <article className="stat-card">
          <p className="stat-card__label">Active contracts</p>
          <div className="stat-card__value"><span>{activeCount}</span></div>
          <p className="stat-card__meta">All active contracts</p>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">Events</p>
          <div className="stat-card__value"><span>{events.length}</span></div>
          <p className="stat-card__meta">Upcoming deadlines</p>
        </article>
        <article className="stat-card">
          <p className="stat-card__label">Expiring soon</p>
          <div className="stat-card__value"><span>{expiringCount}</span></div>
          <p className="stat-card__meta">Ending in next 30 days</p>
        </article>
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
            {events.length === 0 ? <li className="muted">No upcoming events</li> : events.slice(0,4).map(ev => (
              <li key={ev.date_id || ev.due_date}>
                <div>
                  <strong>{ev.date_title || ev.date_details || 'Event'}</strong>
                  <span>{new Date(ev.due_date).toLocaleDateString()}</span>
                </div>
                <span className={`reminders__pill reminders__pill--${ev.type || 'event'}`}>
                  {ev.status || 'pending'}
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
          </header>

          <ul className="timeline">
            {contracts.slice(0,5).map((c) => (
              <li key={c.cont_id || c.file_name}>
                <span>{c.uploaded_at ? new Date(c.uploaded_at).toLocaleTimeString() : ''}</span>
                <p>{(c.contracts_metadata && c.contracts_metadata.cont_name) || c.file_name}</p>
              </li>
            ))}
          </ul>
        </article>

        {/* Center panel: Expiring soon */}
        <article className="dashboard__panel">
          <header>
            <div>
              <p className="panel__eyebrow">Focus</p>
              <h3>Expiring soon</h3>
            </div>
          </header>

          <div className="documents">
            {contracts.filter(c => {
              const ed = c.contracts_metadata?.end_date;
              if (!ed) return false;
              const now = new Date();
              const in30 = new Date(); in30.setDate(now.getDate() + 30);
              const d = new Date(ed);
              return d >= now && d <= in30;
            }).slice(0,5).map(c => (
              <div key={c.cont_id || c.file_name} className="documents__row">
                <div>
                  <strong>{(c.contracts_metadata && c.contracts_metadata.cont_name) || c.file_name}</strong>{' '}
                  <span>Ends: {c.contracts_metadata?.end_date || '—'}</span>
                </div>
                <a className="btn small secondary" href={c.file_url} target="_blank" rel="noreferrer">Open</a>
              </div>
            ))}
            {contracts.filter(c => c.contracts_metadata && c.contracts_metadata.end_date).length === 0 && <div className="empty">No expiring contracts</div>}
          </div>
        </article>

        {/* Upcoming deadlines panel removed per request */}
      </section>
    </div>
  );
}