"use client"
// import Gstyle from "../../app/globals.css";
import Mstyle from "../styles/group.module.css";
import Link from 'next/link';
import { useState } from "react";
import UserProfile from '../../app/session/UserProfile';

export default function join() {

  const [Email, setEmail] = useState({email: ""});

  const handleChange = (e) => {
    setEmail(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Connection attempt with:", Email.email);
  };

  return (
    <div className={Mstyle.page}>
      <div className={Mstyle.main}>
        <h3>Connect to your group right now!</h3>
        <form className={Mstyle.connForm} onSubmit={handleSubmit}>
            <div className={Mstyle.mail} >
              <input 
                placeholder="Type a connection e-mail" 
                type="email"
                name="email"
                value={Email.email}
                onChange={handleChange}
                required
              />
              <img src="/icon/mail_Icon.png" alt="Mail Icon" className={Mstyle.mailIcon} />
            </div>
            <Link href="/mainPage" onNavigate={(e) => {UserProfile.setGName(Email.email);}}><button type="submit">Connect</button></Link>
        </form>
        <div className={Mstyle.createLink}>
          <p>Want to create a new group? <Link href="/create">Click here!</Link></p>
        </div>
      </div>
    </div>
  )
}