import Link from "next/link";
import { concepts, conceptGroups } from "@/data/concepts";
import { categories, problems } from "@/data/problems";
import { slugify } from "@/lib/slugify";

export default function HomePage() {
  const easy = problems.filter((p) => p.difficulty === "EASY").length;
  const medium = problems.filter((p) => p.difficulty === "MEDIUM").length;
  const hard = problems.filter((p) => p.difficulty === "HARD").length;

  return (
    <>
      <h1>SQL 50 Concepts</h1>
      <p className="lead">
        Everything you need to understand to finish LeetCode&apos;s SQL 50 study plan: a list of SQL
        concepts with explanations, and the 50 problems with a PostgreSQL solution for each. Every
        concept links to the problems that use it.
      </p>

      <div className="stats">
        <div className="stat">
          <strong>{concepts.length}</strong>
          <span className="muted">concepts</span>
        </div>
        <div className="stat">
          <strong>{problems.length}</strong>
          <span className="muted">problems</span>
        </div>
        <div className="stat">
          <strong>{categories.length}</strong>
          <span className="muted">groups</span>
        </div>
        <div className="stat">
          <strong>
            {easy} / {medium} / {hard}
          </strong>
          <span className="muted">easy / medium / hard</span>
        </div>
      </div>

      <h2>Concepts</h2>
      <p className="muted">
        <Link href="/concepts">Open the full concepts page</Link> or jump to a topic:
      </p>
      <div className="grid">
        {conceptGroups.map((group) => {
          const inGroup = concepts.filter((c) => c.group === group);
          return (
            <Link key={group} href={`/concepts#${slugify(group)}`} className="card">
              <h3>{group}</h3>
              <p>{inGroup.map((c) => c.title).join(", ")}</p>
            </Link>
          );
        })}
      </div>

      <h2>Problems</h2>
      <p className="muted">
        <Link href="/problems">See all 50 problems</Link>, grouped the same way as the study plan.
      </p>
      <div className="grid">
        {categories.map((cat) => {
          const inCat = problems.filter((p) => p.category === cat.name);
          return (
            <Link key={cat.name} href={`/problems#${slugify(cat.name)}`} className="card">
              <h3>{cat.name}</h3>
              <p>{inCat.length} problems</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}

