"use client"
// import Gstyle from "../../app/globals.css";
import Mstyle from "../styles/group.module.css";
import Link from 'next/link';
import { useState } from "react";
import UserProfile from '../../app/session/UserProfile';
import { useRouter } from "next/navigation";
import { getGroup, joinGroup, requestsConsent } from "@/lib/group";

export default function join() {
  const router = useRouter();
  const [Email, setEmail] = useState({email: ""});

  const handleChange = (e) => {
    setEmail(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleJoin = async (e) => {
    try {
      console.log("User email: "+UserProfile.getEmail())
      const joinSuccess = await joinGroup(UserProfile.getEmail(), Email.email);      
      if (joinSuccess.success) {
        const requestSuccess = await requestsConsent(UserProfile.getEmail(), Email.email, true)
        
        if(requestSuccess.success){ 
          const group = await getGroup(requestSuccess.data)

          const groupData = group.success ? group.data : { group_id: null, group_name: null }

          UserProfile.setGName(groupData.group_name);

          router.push('/mainPage')
        } else throw new Error(requestSuccess.error)
      } else{
        throw new Error(joinSuccess.error)
      }
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  return (
    <div className={Mstyle.page}>
      <div className={Mstyle.main}>
        <h3>Connect to your group right now!</h3>
        <form className={Mstyle.connForm}>
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
            <Link href="/mainPage" onNavigate={(e) => {e.preventDefault(); handleJoin()}}><button type="submit">Connect</button></Link>
        </form>
        <div className={Mstyle.createLink}>
          <p>Want to create a new group? <Link href="/create">Click here!</Link></p>
        </div>
      </div>
    </div>
  )
}