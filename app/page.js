
// import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.DivLog}>
          <h3>
            DOCS COMPILANCE
          </h3>
          <h4 className={styles.welc}>
            Welcome Back!
          </h4>
          <p>
            Sing in to start save your time & money.
          </p>
          <div>
            <form className={styles.LogForm}>
              <label>
                Login
              </label>
              <input type="text"></input>
              <label>
                P@ssword
              </label>
              <input type="password"></input>
            </form>
          </div>
        </div>
        <div className={styles.DivDesc}>
          <p>
            Docs Compliance - kompleksowy system do zarządzania wszystkimi terminami i wymaganiami regulacyjnymi Twojej firmy
          </p>
        </div>
      </main>
    </div>
  );
}
