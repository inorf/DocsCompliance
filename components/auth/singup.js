import styles from "../styles/page.module.css";
import { useEffect, useState } from "react";

export default function Login({ onToggleVisibility}){
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timeout);
  }, []);

    return (
        <div className={`${styles.page} ${visible ? styles.fadeIn : ""}`}>
        <main className={styles.main}>
        <div className={styles.DivLog}>
          <h2>
            DOCS COMPILANCE
          </h2>
          <h4 className={styles.welc}>
            Nice to meet you!
          </h4>
          <p>
            Sign up to start save your time & money.
          </p>
          <div>
            <form className={styles.LogForm}>
              <input placeholder="E-mail" type="email"></input>
              <input placeholder="Your's name" type="text"></input>
              <input placeholder="P@ssword" type="password"></input>
              <div className={styles.formDiv}>
                <button className={styles.sub} type="submit">Sign In</button>
                <button className={styles.sup} type="button"
                  onClick={onToggleVisibility}>
                  Return
                </button>
              </div>
            </form>
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
    )
}