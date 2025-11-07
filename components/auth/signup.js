"use client"
import styles from "../styles/page.module.css";
import Link from 'next/link';
import { useState } from "react";

export default function SignUp() {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Signup attempt:", formData.email, formData.name, formData.password);
  };

  return (
    <div className={`${styles.page} ${styles.fadeIn}`}>
      <main className={styles.main}>
        <div className={styles.DivLog}>
          <h2>DOCS COMPLIANCE</h2>
          <h4 className={styles.welc}>Nice to meet you!</h4>
          <p>Sign up to start save your time & money.</p>
          <div>
          <form className={styles.LogForm} onSubmit={handleSubmit}>
            <input 
              placeholder="E-mail" 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input 
              placeholder="Your's name" 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input 
              placeholder="P@ssword" 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            
            <div className={styles.formDiv}>
              <Link href="/join" onNavigate={(e) => {
                console.log("Login attempt:", formData.email, formData.password );
              }}><button className={styles.sub} type="submit">Sign Up</button></Link>
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