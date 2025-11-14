"use client"
import styles from "../styles/page.module.css";
import Link from 'next/link';
import { useState } from "react";
import UserProfile from '../../app/session/UserProfile';
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData(prev => ({
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
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('All fields are required');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const signUpData = await res.json();
      
      if (!signUpData.success) {
        throw new Error(signUpData.error || 'Sign up failed');
      }

      UserProfile.setEmail(formData.email);
      UserProfile.setName(formData.name);
      router.push('/join')
    } catch (error) {
      console.error('Sign up failed:', error);
      setErrorMsg(error.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.page} ${styles.fadeIn}`}>
      <main className={styles.main}>
        <div className={styles.DivLog}>
          <h2>DOCS COMPLIANCE</h2>
          <h4 className={styles.welc}>Nice to meet you!</h4>
          <p>Sign up to start save your time & money.</p>
          <div>
            <form className={styles.LogForm} onSubmit={handleSubmit} aria-live="polite">
              <div className={styles.mail}>
                <input 
                  id="email"
                  placeholder="E-mail" 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  aria-invalid={errorMsg ? "true" : "false"}
                />
                <img src="/icon/mail_Icon.png" alt="Mail Icon" className={styles.mailIcon} />
              </div>
              <div className={styles.Uname}>
                <input 
                  id="name"
                  placeholder="Your's name" 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  aria-invalid={errorMsg ? "true" : "false"}
                />
                <img src="/icon/pen_Icon.png" alt="Pen Icon" className={styles.penIcon} />
              </div>
              <div className={styles.pass}>
                <input 
                  id="password"
                  placeholder="P@ssword" 
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  aria-invalid={errorMsg ? "true" : "false"}
                />
                <img src="/icon/lock_Icon.png" alt="lock Icon" className={styles.lockIcon} />
              </div>
              {errorMsg && (
                <div role="alert" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {errorMsg}
                </div>
              )}
              <div className={styles.formDiv}>
                <button className={styles.sub} type="submit" disabled={isLoading}>
                  {isLoading ? 'Signing Up...' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
          <div className="switch-auth">
            <p>Already have an account? <Link href="/login">Log in</Link></p>
          </div>
        </div>
        
        <div className={styles.DivDesc}>
          <p>
            <span>Docs Compliance</span> - kompleksowy system do zarządzania wszystkimi terminami i wymaganiami regulacyjnymi Twojej firmy.
          </p>
          <p className={styles.copy}>
            copyright © 2025 Docs Compliance
          </p>
        </div>
      </main>
    </div>
  );
}