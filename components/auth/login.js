"use client"
import styles from "../styles/page.module.css";
import Link from 'next/link';
import { useState } from "react";
import UserProfile from '../../app/session/UserProfile';
import { useRouter } from "next/navigation";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
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
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const loginData = await res.json();
      
      if (!loginData.success) {
        throw new Error(loginData.error || 'Login failed');
      }

      const { name, admin, group } = loginData.data;
      UserProfile.setEmail(formData.email);
      UserProfile.setName(name);
      UserProfile.setAdmin(admin);
      UserProfile.setGName(group?.group_name || null);
      
      router.push('/mainPage');
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMsg(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.page} ${styles.fadeIn}`}>
      <main className={styles.main}>
        <div className={styles.DivLog}>
          <h2>DOCS COMPLIANCE</h2>
          <h4 className={styles.welc}>Welcome Back!</h4>
          <p>Log in to start save your time & money.</p>
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
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
          <div className="switch-auth">
            <p>Don't have an account? <Link href="/signup">Sign up</Link></p>
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