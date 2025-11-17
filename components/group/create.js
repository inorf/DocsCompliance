"use client"
import Mstyle from "../styles/group.module.css";
import Link from 'next/link';
import { useState } from "react";
import UserProfile from '../../app/session/UserProfile';
import { useRouter } from "next/navigation";

export default function Create() {
    const [group, setGroup] = useState({name: ""});
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const router = useRouter();
    
    const handleChange = (e) => {
        setGroup(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setErrorMsg(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);
        
        try {
            const userEmail = UserProfile.getEmail();
            if (!userEmail) throw new Error('No user logged in');
            if (!group.name.trim()) throw new Error('Group name is required');

            const res = await fetch('/api/group/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, groupName: group.name.trim() })
            });

            const createData = await res.json();
            if (!createData.success) throw new Error(createData.error || 'Failed to create group');

            UserProfile.setGName(group.name.trim());
            router.push('/mainPage');
        } catch (error) {
            console.error('Create failed:', error);
            setErrorMsg(error.message || 'Failed to create group. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className={Mstyle.page}>
            <div className={Mstyle.main}>
                <div className={Mstyle.cardHeader}>
                    <p className={Mstyle.kicker}>Create group</p>
                    <h3>Launch your new workspace</h3>
                    <p className={Mstyle.subtitle}>
                        Give your team a memorable name so everyone can find it quickly.
                        You can change it later from Settings.
                    </p>
                </div>
                <form className={Mstyle.connForm} onSubmit={handleSubmit} aria-live="polite">
                    <div className={Mstyle.Uname}>
                        <input 
                            id="groupName"
                            placeholder="Type a name of your group" 
                            type="text"
                            name="name"
                            value={group.name}
                            onChange={handleChange}
                            required
                            aria-required="true"
                            aria-invalid={errorMsg ? "true" : "false"}
                        />
                        <img src="/icon/pen_Icon.png" alt="Pen icon" className={Mstyle.penIcon} />
                    </div>
                    {errorMsg && (
                        <div role="alert" className={Mstyle.statusMessage}>
                            {errorMsg}
                        </div>
                    )}
                    <button type="submit" className={Mstyle.submitButton} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Group'}
                    </button>
                </form>
                <div className={Mstyle.createLink}>
                    <p className={Mstyle.helperText}>
                        Want to connect to a group? <Link href="/join">Request access</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}