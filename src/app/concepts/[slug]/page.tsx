import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sql3DViewer, getConceptScenario } from "@/components/sql-3d-engine";
import { concepts, getConcept } from "@/data/concepts";
import { getProblem } from "@/data/problems";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return concepts.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const concept = getConcept(slug);
  if (!concept) return {};
  return {
    title: `${concept.title} · SQL Concepts`,
    description: concept.summary,
  };
}

export default async function ConceptDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const concept = getConcept(slug);
  if (!concept) notFound();

  const index = concepts.findIndex((c) => c.slug === concept.slug);
  const previous = concepts[index - 1];
  const next = concepts[index + 1];

  const scenario = getConceptScenario(concept.slug, concept.title);

  return (
    <>
      <p className="crumbs">
        <Link href="/concepts">Concepts</Link> / {concept.group}
      </p>

      <h1>
        {concept.title} <span className={`badge ${concept.level}`}>{concept.level}</span>
      </h1>

      <p className="lead">
        <strong>{concept.summary}</strong>
      </p>

      {concept.prerequisites.length > 0 && (
        <p className="muted">
          Read first:{" "}
          {concept.prerequisites.map((preSlug, i) => {
            const pre = getConcept(preSlug);
            return (
              <span key={preSlug}>
                {i > 0 && ", "}
                <Link href={`/concepts/${preSlug}`}>{pre?.title ?? preSlug}</Link>
              </span>
            );
          })}
        </p>
      )}

      {/* 3D Visual Simulation Section */}
      <h2>3D Interactive Simulation</h2>
      <Sql3DViewer
        title={scenario.title}
        customTables={scenario.tables}
        customSteps={scenario.steps}
      />

      <h2>Explanation</h2>
      {concept.explanation.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}

      <h2>Example Query</h2>
      <pre>
        <code>{concept.example.sql}</code>
      </pre>
      <p className="muted">{concept.example.note}</p>

      <h2>Common mistakes</h2>
      <ul>
        {concept.pitfalls.map((pitfall) => (
          <li key={pitfall}>{pitfall}</li>
        ))}
      </ul>

      <h2>Used in these problems</h2>
      <ul className="pill-list">
        {concept.problems.map((id) => {
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

      <hr style={{ margin: "2rem 0", borderColor: "var(--border)", borderStyle: "solid" }} />

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        {previous ? (
          <Link href={`/concepts/${previous.slug}`}>
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/concepts/${next.slug}`}>
            {next.title} →
          </Link>
        )}
      </div>
    </>
  );
}
