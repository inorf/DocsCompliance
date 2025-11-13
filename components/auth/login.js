"use client"
import styles from "../styles/page.module.css";
import Link from 'next/link';
import { useState } from "react";
import UserProfile from '../../app/session/UserProfile';
import { login } from "@/lib/auth";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e) => {
    setIsLoading(true);
    
    try {
      const loginData = await login(formData.email, formData.password); // Your actual login function
      setLoginSuccess(loginData.success);
      
      if (loginData.success) {
        UserProfile.setEmail(formData.email);
        UserProfile.setName(loginData.name);
        UserProfile.setAdmin(loginData.admin);
        UserProfile.setGName(loginData.group.group_name);
        console.log(UserProfile.getEmail(), UserProfile.getAdmin(), UserProfile.getGName(), UserProfile.getName());
        window.location.href = '/mainPage';
      } else{
        throw new Error(loginData.error)
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginSuccess(false);
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
          <form className={styles.LogForm}>
            <div className={styles.mail} >
              <input 
                placeholder="E-mail" 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <img src="/icon/mail_Icon.png" alt="Mail Icon" className={styles.mailIcon} />
            </div>
            <div className={styles.pass} >
              <input 
                placeholder="P@ssword" 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <img src="/icon/lock_Icon.png" alt="lock Icon" className={styles.lockIcon} />
            </div>
            <div className={styles.formDiv}>
              <Link href="/mainPage" onClick={(e) => {e.preventDefault(); handleLogin()}}>
                <button className={styles.sub} type="submit" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </Link>
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