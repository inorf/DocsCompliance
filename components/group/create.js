"use client"
// import Gstyle from "../../app/globals.css";
import Mstyle from "../styles/group.module.css";
import Link from 'next/link';
import { useState } from "react";
import UserProfile from '../../app/session/UserProfile';

export default function create() {

    const [Group, setGroup] = useState({name: ""});

    const handleChange = (e) => {
        setGroup(prev => ({
        ...prev,
        [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Group creating attempt:", Group.name);
    };
    return (
        <div className={Mstyle.page}>
            <div className={Mstyle.main}>
                    <h3>Make your own group!</h3>
                <form className={Mstyle.connForm} onSubmit={handleSubmit}>
                    <div className={Mstyle.Uname} >
                        <input 
                            placeholder="Type a name of your group" 
                            type="text"
                            name="name"
                            value={Group.name}
                            onChange={handleChange}
                            required
                        />
                        <img src="/icon/pen_Icon.png" alt="Pen Icon" className={Mstyle.penIcon} />
                    </div>
                    <Link href="/mainPage" onNavigate={(e) => {UserProfile.setGName(Group.name);}}><button type="submit">Create Group</button></Link>
                    
                </form>
                <div className={Mstyle.createLink}>
                    <p>Want to connect to a group? <Link href="/join">Click here!</Link></p>
                </div>
            </div>
        </div>
    )
}