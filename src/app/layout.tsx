import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SQL 50 Concepts",
    template: "%s | SQL 50 Concepts",
  },
  description:
    "The SQL concepts you need to understand to finish LeetCode's SQL 50 study plan, with the 50 problems and PostgreSQL solutions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="inner">
            <Link href="/" className="brand">
              SQL 50 Concepts
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/concepts">Concepts</Link>
              <Link href="/problems">Problems</Link>
              <Link href="/playground">3D Playground</Link>
              <Link href="/verify">Verify</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          Problem list from LeetCode&apos;s SQL 50 study plan. Solutions are written for PostgreSQL.
        </footer>
      </body>
    </html>
  );
}
