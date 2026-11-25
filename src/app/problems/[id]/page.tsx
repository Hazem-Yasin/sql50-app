import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { concepts } from "@/data/concepts";
import { getProblem, leetcodeUrl, problems } from "@/data/problems";
import { PROBLEM_SCENARIOS } from "@/data/problem-scenarios";
import { ProblemViewer } from "@/components/ProblemViewer";
import { DbLabPanel } from "@/components/DbLabPanel";
import { getLab } from "@/data/db-labs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return problems.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const problem = getProblem(Number(id));
  if (!problem) return {};
  return {
    title: `${problem.id}. ${problem.title}`,
    description: `PostgreSQL solution and the SQL concepts needed for LeetCode ${problem.id}: ${problem.title}.`,
  };
}

export default async function ProblemPage({ params }: PageProps) {
  const { id } = await params;
  const problem = getProblem(Number(id));
  if (!problem) notFound();

  const lab = getLab(problem.id);
  const needed = concepts.filter((c) => c.problems.includes(problem.id));
  const index = problems.findIndex((p) => p.id === problem.id);
  const previous = problems[index - 1];
  const next = problems[index + 1];

  return (
    <>
      <p className="crumbs">
        <Link href="/problems">Problems</Link> / {problem.category}
      </p>
      <h1>
        {problem.id}. {problem.title}
      </h1>
      <p>
        <span className={`badge ${problem.difficulty}`}>{problem.difficulty}</span>
        <span className="muted">
          Problem {problem.position} of {problems.length} · {problem.category}
        </span>
      </p>
      <p>
        <a href={leetcodeUrl(problem)} target="_blank" rel="noreferrer">
          Open this problem on LeetCode
        </a>
      </p>

      <h2>Concepts you need</h2>
      <ul className="pill-list">
        {needed.map((c) => (
          <li key={c.slug}>
            <Link href={`/concepts/${c.slug}`}>{c.title}</Link>
          </li>
        ))}
      </ul>

      {PROBLEM_SCENARIOS[problem.id] && (
        <>
          <h2>3D Execution Visualizer</h2>
          <p className="muted">
            Step through how this query executes — tables, joins, filters, and results rendered in real-time 3D.
          </p>
          <ProblemViewer scenario={PROBLEM_SCENARIOS[problem.id]} />
        </>
      )}

      {lab && (
        <>
          <h2>Practice database</h2>
          <DbLabPanel id={lab.id} issue={lab.issue} seed={lab.seed} solution={problem.postgresql} />
        </>
      )}

      <h2>PostgreSQL solution</h2>
      <p className="muted">
        Written for PostgreSQL and not yet checked against LeetCode&apos;s tests. Try the problem
        yourself first.
      </p>
      <pre>
        <code>{problem.postgresql}</code>
      </pre>

      <p>
        {previous && (
          <Link href={`/problems/${previous.id}`}>
            ← {previous.id} {previous.title}
          </Link>
        )}
      </p>
      <p>
        {next && (
          <Link href={`/problems/${next.id}`}>
            {next.id} {next.title} →
          </Link>
        )}
      </p>
    </>
  );
}
