"use client"
// import Gstyle from "../../app/globals.css";
import Mstyle from "../styles/group.module.css";
import Link from 'next/link';
import { useState } from "react";
import UserProfile from '../../app/session/UserProfile';
import { useRouter } from "next/navigation";

export default function join() {
  const router = useRouter();
  const [Email, setEmail] = useState({email: ""});
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleChange = (e) => {
    setEmail(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleJoin = async (e) => {
    e?.preventDefault()
    setErrorMsg(null)
    setLoading(true)
    try {
      const userEmail = UserProfile.getEmail()
      if (!userEmail) throw new Error('No current user')

      const joinRes = await fetch('/api/group/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, adminEmail: Email.email })
      }).then(r => r.json())

      if (!joinRes.success) throw new Error(joinRes.error || 'Join failed')

      setErrorMsg(null)
      alert('Join request sent! Wait for admin approval.')
      setEmail({ email: '' })
    } catch (error) {
      console.error('Join failed:', error)
      setErrorMsg(error.message || 'Failed to send join request')
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className={Mstyle.page}>
      <div className={Mstyle.main}>
        <div className={Mstyle.cardHeader}>
          <p className={Mstyle.kicker}>Join group</p>
          <h3>Send your request to the admin</h3>
          <p className={Mstyle.subtitle}>
            Enter the email address of the group administrator and we will notify
            them instantly.
          </p>
        </div>
        <form className={Mstyle.connForm} onSubmit={handleJoin} aria-live="polite">
            <div className={Mstyle.mail}>
              <input 
                id="adminEmail"
                placeholder="Type a connection e-mail" 
                type="email"
                name="email"
                value={Email.email}
                onChange={handleChange}
                required
                aria-required="true"
              />
              <img src="/icon/mail_Icon.png" alt="Mail icon" className={Mstyle.mailIcon} />
            </div>
            <button type="submit" className={Mstyle.submitButton} disabled={loading}>
              {loading ? 'Sending request…' : 'Send request'}
            </button>
            {errorMsg && (
              <div role="alert" className={Mstyle.statusMessage}>
                {errorMsg}
              </div>
            )}
        </form>
        <div className={Mstyle.createLink}>
          <p className={Mstyle.helperText}>
            Want to create a new group? <Link href="/create">Start from scratch</Link>
          </p>
        </div>
      </div>
    </div>
  )
}