"use client"
// import Gstyle from "../../app/globals.css";
import Mstyle from "../styles/group.module.css";
import Link from 'next/link';
import { useState } from "react";

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
                    <input 
                    placeholder="Type a name of your group" 
                    type="text"
                    name="name"
                    value={Group.name}
                    onChange={handleChange}
                    required
                    />
                    <button type="submit">Create Group</button>
                </form>
                <div className={Mstyle.createLink}>
                    <p>Want to connect to a group? <Link href="/join">Click here!</Link></p>
                </div>
            </div>
        </div>
    )
}