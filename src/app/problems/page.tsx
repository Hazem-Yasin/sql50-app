import type { Metadata } from "next";
import Link from "next/link";
import { categories, problems } from "@/data/problems";
import { slugify } from "@/lib/slugify";

export const metadata: Metadata = {
  title: "Problems",
  description: "The 50 problems of LeetCode's SQL 50 study plan, grouped like the plan.",
};

export default function ProblemsPage() {
  return (
    <>
      <h1>The 50 problems</h1>
      <p className="lead">
        Grouped in the same order as LeetCode&apos;s SQL 50 study plan. Open a problem to see its
        PostgreSQL solution and the concepts it needs.
      </p>

      {categories.map((cat) => (
        <section key={cat.name} id={slugify(cat.name)}>
          <h2>{cat.name}</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Problem</th>
                  <th>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {problems
                  .filter((p) => p.category === cat.name)
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>
                        <Link href={`/problems/${p.id}`}>{p.title}</Link>
                      </td>
                      <td>
                        <span className={`badge ${p.difficulty}`}>{p.difficulty}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
