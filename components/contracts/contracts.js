"use client";

import React, { useEffect, useState } from "react";
import UserProfile from '@/app/session/UserProfile';
import '@/components/styles/Contracts.scss';

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
  
  // extracted dates state
  const [extractedDates, setExtractedDates] = useState([]);
  const [extractingDates, setExtractingDates] = useState(false);
  const [selectedExtractedDates, setSelectedExtractedDates] = useState(new Set());
  const [preUploadedContId, setPreUploadedContId] = useState(null);

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

  async function handleFileSelection(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setExtractedDates([]);
    setSelectedExtractedDates(new Set());
    setError('');
    
    // Extract dates from the file asynchronously
    await extractDatesFromFile(selectedFile);
  }

  async function extractDatesFromFile(selectedFile) {
    try {
      setExtractingDates(true);
      
      // First, we need to upload the file to get cont_id, then extract dates
      // For now, we'll create a temporary container to hold file data for extraction
      const email = UserProfile.getEmail();
      if (!email) {
        setError('User email not found');
        return;
      }

      // Create FormData for file upload
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('email', email);

      // Upload file first to get cont_id
      const uploadRes = await fetch('/api/contracts/upload', { 
        method: 'POST', 
        body: fd 
      });
      const uploadPayload = await uploadRes.json();
      
      if (!uploadPayload.success) {
        setError(`Upload failed: ${uploadPayload.error}`);
        return;
      }

      const cont_id = uploadPayload.cont_id;
      setPreUploadedContId(cont_id);

      // Now extract dates using the uploaded file
      const extractRes = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_name: selectedFile.name,
          contId: cont_id
        })
      });

      const extractPayload = await extractRes.json();

      if (!extractPayload.success) {
        // If extraction failed but it's not a server error, allow manual entry
        if (extractPayload.warning) {
          console.warn('Extraction warning:', extractPayload.warning);
        } else {
          setError(`Failed to extract dates: ${extractPayload.error}`);
          return;
        }
      }

      // Store extracted dates (may be empty if extraction failed)
      setExtractedDates(extractPayload.extracted_dates || []);
      
      // Show warning if provided
      if (extractPayload.warning) {
        console.log('Date extraction warning:', extractPayload.warning);
      }
      
      // Pre-select all extracted dates by default
      if (extractPayload.extracted_dates && extractPayload.extracted_dates.length > 0) {
        const allIndices = new Set(extractPayload.extracted_dates.map((_, idx) => idx));
        setSelectedExtractedDates(allIndices);
      }

    } catch (err) {
      console.error('Date extraction error:', err);
      setError(`Error extracting dates: ${err.message}`);
    } finally {
      setExtractingDates(false);
    }
  }

  function toggleExtractedDate(index) {
    setSelectedExtractedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
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

  // Convert various human date formats into ISO yyyy-MM-dd or return null if unparseable
  function parseToISO(dateStr) {
    if (!dateStr) return null
    const s = String(dateStr).trim()
    // already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

    // try YYYY/MM/DD or YYYY.MM.DD
    const ymd = s.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/)
    if (ymd) {
      const y = Number(ymd[1])
      const m = Number(ymd[2])
      const d = Number(ymd[3])
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y.toString().padStart(4,'0')}-${m.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`
      }
    }

    // try D/M/YYYY or M/D/YYYY or variants with 2-digit year
    const dmy = s.match(/^(\d{1,2})[\/\-\. ](\d{1,2})[\/\-\. ](\d{2,4})$/)
    if (dmy) {
      let a = Number(dmy[1])
      let b = Number(dmy[2])
      let y = Number(dmy[3])
      if (y < 100) y = 2000 + y

      // decide order: if first > 12 then it's day-month-year; if second > 12 then month-day-year
      let day, month
      if (a > 12 && b <= 12) {
        day = a; month = b
      } else if (b > 12 && a <= 12) {
        day = b; month = a
      } else {
        // both <=12 or both >12: prefer day-first (DD/MM/YYYY) as default locale
        day = a; month = b
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${y.toString().padStart(4,'0')}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`
      }
    }

    // last-resort: try Date.parse
    const parsed = new Date(s)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0,10)
    }

    return null
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
      let cont_id = preUploadedContId;
      
      // If we have a pre-extracted cont_id from file selection, use it
      // Otherwise upload now
      if (!cont_id) {
        // step 1: upload file (form-data)
        const fd = new FormData();
        fd.append('file', file);
        fd.append('email', email);

        const r1 = await fetch('/api/contracts/upload', { method: 'POST', body: fd });
        const p1 = await r1.json();
        if (!p1.success) throw new Error(p1.error || 'Upload failed');

        cont_id = p1.cont_id;
      }

      // step 2: set metadata
      const metadata = { cont_name: contName, cont_details: contDetails, start_date: startDate || null, end_date: endDate || null, status: 'active' };
      const r2 = await fetch('/api/contracts/metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, cont_id, metadata }) });
      const p2 = await r2.json();
      if (!p2.success) throw new Error(p2.error || 'Failed to set metadata');

      // step 3: combine manual milestones with selected extracted dates
      const allMilestones = [...milestones];
      
      // Add selected extracted dates as milestones
      selectedExtractedDates.forEach(index => {
        const extracted = extractedDates[index];
        if (extracted) {
          allMilestones.push({
            date_title: extracted.date,
            due_date: extracted.date,
            assigned_to: email,
            date_details: extracted.description
          });
        }
      });

      if (allMilestones.length > 0) {
        // normalize milestones to expected shape and convert dates to ISO (yyyy-mm-dd)
        const normalized = allMilestones.map(m => {
          const parsedISO = parseToISO(m.due_date);
          return {
            original_due_date: m.due_date,
            date_title: m.date_title || 'Milestone',
            due_date: parsedISO,
            assigned_to: m.assigned_to || email,
            date_details: m.date_details || ''
          }
        })

        // Filter out entries we couldn't parse to avoid DB errors
        const invalid = normalized.filter(n => !n.due_date)
        const toCreate = normalized.filter(n => n.due_date).map(n => ({
          date_title: n.date_title,
          due_date: n.due_date,
          assigned_to: n.assigned_to,
          date_details: n.date_details || (n.original_due_date ? `Original: ${n.original_due_date}` : '')
        }))

        if (invalid.length > 0) {
          // Notify user which dates were skipped due to parse errors
          const skipped = invalid.map(i => i.original_due_date || '').filter(Boolean)
          setError(`Skipped ${skipped.length} milestone(s) because their dates couldn't be parsed: ${skipped.join(', ')}. They have been added as manual milestones so you can set correct dates.`)
          // Add skipped items as manual milestones so the user can correct dates via the form
          const manualFromSkipped = invalid.map(i => ({ date_title: i.original_due_date || 'Milestone', due_date: '', assigned_to: email, date_details: '' }))
          setMilestones(prev => [...prev, ...manualFromSkipped])
        }

        if (toCreate.length > 0) {
          const r3 = await fetch('/api/contracts/create-dates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, cont_id, dates: toCreate }) });
          const p3 = await r3.json();
          if (!p3.success) throw new Error(p3.error || 'Failed to create contract dates');
        }
      }

      // refresh
      await fetchList(email);
      // reset and close
      setFile(null); setContName(''); setContDetails(''); setStartDate(''); setEndDate(''); setMilestones([]);
      setExtractedDates([]);
      setSelectedExtractedDates(new Set());
      setPreUploadedContId(null);
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
              <button className="close" onClick={() => {
                setShowUpload(false);
                setFile(null);
                setContName('');
                setContDetails('');
                setStartDate('');
                setEndDate('');
                setMilestones([]);
                setExtractedDates([]);
                setSelectedExtractedDates(new Set());
                setPreUploadedContId(null);
                setError('');
              }}>×</button>
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
                <div className="label">Upload PDF / DOCX / TXT</div>
                <input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleFileSelection} disabled={extractingDates} />
              </div>

              {extractingDates && (
                <div className="field" style={{padding:'8px', backgroundColor:'rgba(37, 99, 235, 0.1)', borderRadius:'6px'}}>
                  <div style={{fontSize:'0.9rem', color:'#2563eb'}}>Scanning document for dates...</div>
                </div>
              )}

              {extractedDates.length > 0 && (
                <div className="field">
                  <div className="label">Dates found in document ({extractedDates.length})</div>
                  <div style={{display:'flex', flexDirection:'column', gap:'8px', maxHeight:'200px', overflowY:'auto', padding:'8px', backgroundColor:'rgba(0,0,0,0.02)', borderRadius:'6px'}}>
                    {extractedDates.map((date, idx) => (
                      <label key={idx} style={{display:'flex', gap:'8px', alignItems:'flex-start', padding:'6px', cursor:'pointer', borderRadius:'4px', backgroundColor:selectedExtractedDates.has(idx) ? 'rgba(37, 99, 235, 0.1)' : 'transparent'}}>
                        <input type="checkbox" checked={selectedExtractedDates.has(idx)} onChange={() => toggleExtractedDate(idx)} style={{marginTop:'2px'}} />
                        <div style={{flex:1}}>
                          <div style={{fontWeight:'600', fontSize:'0.9rem'}}>{date.date}</div>
                          <div style={{fontSize:'0.85rem', color:'var(--muted)', marginTop:'2px'}}>{date.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="label">Manual Milestones (optional)</div>
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
                <button className="btn primary" type="button" onClick={() => {
                  setShowUpload(false);
                  setFile(null);
                  setContName('');
                  setContDetails('');
                  setStartDate('');
                  setEndDate('');
                  setMilestones([]);
                  setExtractedDates([]);
                  setSelectedExtractedDates(new Set());
                  setPreUploadedContId(null);
                  setError('');
                }} disabled={uploading}>Cancel</button>
                <button className="btn primary" type="submit" disabled={uploading || extractingDates}>{uploading ? 'Uploading…' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
