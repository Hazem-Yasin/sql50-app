import type { Metadata } from "next";
import Link from "next/link";
import { concepts, conceptGroups } from "@/data/concepts";
import { slugify } from "@/lib/slugify";

export const metadata: Metadata = {
  title: "Concepts",
  description: "The SQL concepts needed to solve all 50 problems of LeetCode's SQL 50 study plan.",
};

export default function ConceptsPage() {
  return (
    <>
      <h1>SQL concepts for the SQL 50</h1>
      <p className="lead">
        Explore {concepts.length} SQL concepts organized from querying basics to advanced techniques.
        Each topic includes an in-depth explanation, a step-by-step interactive 3D visual simulation,
        common pitfalls, and the LeetCode SQL 50 problems that use it.
      </p>

      <nav className="toc" aria-label="Table of contents">
        <h3>Categories</h3>
        {conceptGroups.map((group) => (
          <ul key={group}>
            <li>
              <strong>{group}</strong>
            </li>
            {concepts
              .filter((c) => c.group === group)
              .map((c) => (
                <li key={c.slug}>
                  <Link href={`/concepts/${c.slug}`}>{c.title}</Link>
                </li>
              ))}
          </ul>
        ))}
      </nav>

      {conceptGroups.map((group) => {
        const groupConcepts = concepts.filter((c) => c.group === group);
        return (
          <section key={group} id={slugify(group)}>
            <h2>{group}</h2>
            <div className="grid">
              {groupConcepts.map((c) => (
                <Link key={c.slug} href={`/concepts/${c.slug}`} className="card">
                  <h3>
                    <span className={`badge ${c.level}`}>{c.level}</span>
                    {c.title}
                  </h3>
                  <p>{c.summary}</p>
                  <p className="muted" style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                    {c.problems.length} {c.problems.length === 1 ? "problem" : "problems"} · 3D visual available
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
