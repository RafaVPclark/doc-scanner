import Image from "next/image";
import styles from "./dashboard/dashboard.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Doc-Scanner!</h1>
      </main>
    </div>
  );
}
