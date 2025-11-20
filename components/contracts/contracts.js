"use client";

import React, { useEffect, useState } from "react";
import UserProfile from '../../app/session/UserProfile';
import '../../components/styles/Contracts.scss';

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  // upload form state
  const [file, setFile] = useState(null);
  const [contName, setContName] = useState('');
  const [contDetails, setContDetails] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    const email = UserProfile.getEmail();
    if (!email) return;
    fetchList(email);
  }, []);

  async function fetchList(email) {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const payload = await res.json();
      if (payload.success) {
        setContracts(payload.data || []);
      } else {
        setContracts([]);
        setError(payload.error || 'Failed to load contracts');
      }
    } catch (e) {
      console.error('fetchList', e);
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }

  function openDetails(c) {
    setDetail(c);
  }

  function closeDetails() {
    setDetail(null);
  }

  async function handleDelete() {
    if (!detail || !detail.cont_id) return;
    if (!confirm('Delete this contract? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/contracts/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cont_id: detail.cont_id }) });
      const payload = await res.json();
      if (!payload.success) throw new Error(payload.error || 'Failed to delete contract');

      // remove from list and close
      setContracts(list => list.filter(c => (c.cont_id || c.file_name) !== (detail.cont_id || detail.file_name)));
      setDetail(null);
    } catch (err) {
      console.error('delete contract', err);
      setError(err.message || 'Failed to delete contract');
    } finally {
      setDeleting(false);
    }
  }

  function addMilestone() {
    setMilestones(m => [...m, { date_title: '', due_date: '', assigned_to: UserProfile.getEmail() }]);
  }

  function updateMilestone(idx, key, value) {
    setMilestones(m => m.map((mm, i) => i === idx ? { ...mm, [key]: value } : mm));
  }

  async function handleUpload(e) {
    e.preventDefault();
    const email = UserProfile.getEmail();
    if (!email) { setError('Missing user email'); return }
    if (!file) { setError('Please select a file'); return }

    setUploading(true);
    setError('');
    try {
      // step 1: upload file (form-data)
      const fd = new FormData();
      fd.append('file', file);
      fd.append('email', email);

      const r1 = await fetch('/api/contracts/upload', { method: 'POST', body: fd });
      const p1 = await r1.json();
      if (!p1.success) throw new Error(p1.error || 'Upload failed');

      const cont_id = p1.cont_id;

      // step 2: set metadata
      const metadata = { cont_name: contName, cont_details: contDetails, start_date: startDate || null, end_date: endDate || null, status: 'active' };
      const r2 = await fetch('/api/contracts/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, cont_id, metadata }) });
      const p2 = await r2.json();
      if (!p2.success) throw new Error(p2.error || 'Failed to set metadata');

      // step 3: optional create dates (milestones)
      if (milestones.length > 0) {
        // normalize milestones to expected shape
        const datesPayload = milestones.map(m => ({ date_title: m.date_title || 'Milestone', due_date: m.due_date, assigned_to: m.assigned_to || email }));
        const r3 = await fetch('/api/contracts/create-dates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, cont_id, dates: datesPayload }) });
        const p3 = await r3.json();
        if (!p3.success) throw new Error(p3.error || 'Failed to create contract dates');
      }

      // refresh
      await fetchList(email);
      // reset and close
      setFile(null); setContName(''); setContDetails(''); setStartDate(''); setEndDate(''); setMilestones([]);
      setShowUpload(false);
    } catch (err) {
      console.error('upload', err);
      setError(err.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <div>
          <h1>Contracts</h1>
          <p className="muted">Uploaded contracts for your workspace. Click Details for metadata and dates.</p>
        </div>
        <div>
          <button className="btn primary" onClick={() => setShowUpload(true)}>Upload new contract</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading…</div> : (
        <div className="contracts-list">
          {contracts.length === 0 ? <div className="empty">No contracts found</div> : contracts.map(c => (
            <div key={c.cont_id || c.file_name} className="contract-card">
              <div className="card-row">
                <div className="card-title">{(c.contracts_metadata && c.contracts_metadata.cont_name) || c.file_name}</div>
                <div className="card-actions">
                  <button className="btn small" onClick={() => openDetails(c)}>Details…</button>
                </div>
              </div>
              <div className="card-meta">
                <div><strong>File:</strong> <span className="break">{c.file_name}</span></div>
                <div><strong>Start:</strong> {c.contracts_metadata?.start_date || '—'}</div>
                <div><strong>End:</strong> {c.contracts_metadata?.end_date || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalHeader">
              <h3>Contract details</h3>
              <button className="close" onClick={closeDetails}>×</button>
            </div>
            <div className="modalBody">
              <div><strong>Contract ID:</strong> {detail.cont_id || '—'}</div>
              <div><strong>Name:</strong> {detail.contracts_metadata?.cont_name || '—'}</div>
              <div><strong>Details:</strong> <div className="preWrap">{detail.contracts_metadata?.cont_details || '—'}</div></div>
              <div><strong>Start:</strong> {detail.contracts_metadata?.start_date || '—'}</div>
              <div><strong>End:</strong> {detail.contracts_metadata?.end_date || '—'}</div>
              <div><strong>Status:</strong> {detail.contracts_metadata?.status || '—'}</div>
              {
                (() => {
                  // API sometimes returns an object for name (e.g. { user_name })
                  const uploaderName = typeof detail.name === 'string' ? detail.name : (detail.name && detail.name.user_name) ? detail.name.user_name : '—';
                  const uploaderEmail = typeof detail.email === 'string' ? detail.email : (detail.email && detail.email.email) ? detail.email.email : '—';
                  return <div><strong>Uploaded by:</strong> {uploaderName} &lt;{uploaderEmail}&gt;</div>
                })()
              }
              <div><strong>File:</strong> <a href={detail.file_url} target="_blank" rel="noreferrer">{detail.file_name}</a></div>

              {detail.contracts_dates && detail.contracts_dates.length > 0 && (
                <div style={{marginTop:12}}>
                  <strong>Milestones</strong>
                  <div className="milestones">
                    {detail.contracts_dates.map((cd, idx) => {
                      const d = cd.dates || cd;
                      const assignedName = typeof d.name === 'string' ? d.name : (d.name && d.name.user_name) ? d.name.user_name : '—';
                      const assignedEmail = typeof d.email === 'string' ? d.email : (d.email && d.email.email) ? d.email.email : '—';
                      return (
                        <div key={d.date_id || idx} className="milestone">
                          <div className="milestone-title">{d.date_title || 'Untitled'}</div>
                          <div className="milestone-meta">Due: {d.due_date || '—'} • Status: {d.status || '—'}</div>
                          <div className="milestone-assigned">Assigned to: {assignedName} &lt;{assignedEmail}&gt;</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modalFooter">
              <button className="btn danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete contract'}</button>
              <button className="btn" onClick={closeDetails}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modal small">
            <div className="modalHeader">
              <h3>Upload contract</h3>
              <button className="close" onClick={() => setShowUpload(false)}>×</button>
            </div>
            <form onSubmit={handleUpload} className="modalBody">
              <label className="field">
                <div className="label">Contract name</div>
                <input value={contName} onChange={e => setContName(e.target.value)} placeholder="Short contract name" />
              </label>

              <label className="field">
                <div className="label">Details</div>
                <textarea value={contDetails} onChange={e => setContDetails(e.target.value)} placeholder="Optional details" />
              </label>

              <div className="fieldsRow">
                <label className="field small">
                  <div className="label">Start date</div>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </label>
                <label className="field small">
                  <div className="label">End date</div>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </label>
              </div>

              <div className="field">
                <div className="label">Upload PDF / DOCX</div>
                <input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={e => setFile(e.target.files[0])} />
              </div>

              <div className="label">Milestones (optional)</div>
              {milestones.map((m, idx) => (
                <div key={idx} className="milestoneRow">
                  <input placeholder="Title" value={m.date_title} onChange={e => updateMilestone(idx, 'date_title', e.target.value)} />
                  <input type="date" value={m.due_date} onChange={e => updateMilestone(idx, 'due_date', e.target.value)} />
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button type="button" className="btn primary" onClick={addMilestone}>Add milestone</button>
                <div className="muted" style={{alignSelf:'center'}}>Optional reminders or important dates</div>
              </div>

              {error && <div className="formError">{error}</div>}

              <div className="modalFooter">
                <button className="btn primary" type="button" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</button>
                <button className="btn primary" type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
