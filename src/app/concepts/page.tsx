import type { Metadata } from "next";
import Link from "next/link";
import { concepts, conceptGroups, getConcept } from "@/data/concepts";
import { getProblem } from "@/data/problems";
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
        {concepts.length} concepts, ordered from the basics to the advanced topics. Each one has a
        plain explanation, a short example, the common mistakes, and the problems from the SQL 50
        that use it. Read the prerequisites first if a topic feels unclear.
      </p>

      <nav className="toc" aria-label="Table of contents">
        <h3>Contents</h3>
        {conceptGroups.map((group) => (
          <ul key={group}>
            <li>
              <strong>{group}</strong>
            </li>
            {concepts
              .filter((c) => c.group === group)
              .map((c) => (
                <li key={c.slug}>
                  <a href={`#${c.slug}`}>{c.title}</a>
                </li>
              ))}
          </ul>
        ))}
      </nav>

      {conceptGroups.map((group) => (
        <section key={group} id={slugify(group)}>
          <h2>{group}</h2>

          {concepts
            .filter((c) => c.group === group)
            .map((c) => (
              <article key={c.slug} id={c.slug} className="concept">
                <h3>
                  {c.title} <span className={`badge ${c.level}`}>{c.level}</span>
                </h3>
                <p>
                  <strong>{c.summary}</strong>
                </p>

                {c.prerequisites.length > 0 && (
                  <p className="muted">
                    Read first:{" "}
                    {c.prerequisites.map((slug, i) => {
                      const pre = getConcept(slug);
                      return (
                        <span key={slug}>
                          {i > 0 && ", "}
                          <a href={`#${slug}`}>{pre?.title ?? slug}</a>
                        </span>
                      );
                    })}
                  </p>
                )}

                {c.explanation.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}

                <pre>
                  <code>{c.example.sql}</code>
                </pre>
                <p className="muted">{c.example.note}</p>

                <h3>Common mistakes</h3>
                <ul>
                  {c.pitfalls.map((pitfall) => (
                    <li key={pitfall}>{pitfall}</li>
                  ))}
                </ul>

                <h3>Used in these problems</h3>
                <ul className="pill-list">
                  {c.problems.map((id) => {
                    const problem = getProblem(id);
                    if (!problem) return null;
                    return (
                      <li key={id}>
                        <Link href={`/problems/${id}`}>
                          {id} {problem.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
        </section>
      ))}
    </>
  );
}
