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
        <h3>Connect to your group right now!</h3>
        <form className={Mstyle.connForm} onSubmit={handleJoin} aria-live="polite">
            <div className={Mstyle.mail} >
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
              <img src="/icon/mail_Icon.png" alt="Mail Icon" className={Mstyle.mailIcon} />
            </div>
            <button type="submit" disabled={loading}>{loading ? 'Connecting…' : 'Connect'}</button>
            {errorMsg && <div role="alert" style={{color:'red'}}>{errorMsg}</div>}
        </form>
        <div className={Mstyle.createLink}>
          <p>Want to create a new group? <Link href="/create">Click here!</Link></p>
        </div>
      </div>
    </div>
  )
}