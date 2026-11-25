import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { scaleSeed } from "../src/data/db-labs/scale.ts";

const factor = Number(process.env.LAB_SCALE || 1);

const dir = "src/data/db-labs";
const problems = JSON.parse(readFileSync("src/data/problems.json", "utf8")).problems;
let failed = 0;
const only = process.argv.slice(2).map(Number);
for (const f of readdirSync(dir).filter((n) => n.startsWith("labs-"))) {
  const text = readFileSync(`${dir}/${f}`, "utf8");
  const re = /id:\s*(\d+),\s*issue:\s*"([^"]*)",\s*seed:\s*`([\s\S]*?)`,/g;
  let m;
  while ((m = re.exec(text))) {
    const id = Number(m[1]);
    if (only.length && !only.includes(id)) continue;
    const db = new PGlite();
    const t0 = Date.now();
    try {
      await db.exec(scaleSeed(m[3], factor));
      const tabs = await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
      let total = 0;
      for (const t of tabs.rows) total += Number((await db.query(`SELECT count(*) n FROM "${t.tablename}"`)).rows[0].n);
      const sol = problems.find((p) => p.id === id)?.postgresql;
      const r = await db.query(sol.replace(/;\s*$/, ""));
      console.log(`OK   ${id} rows=${total} seedMs=${Date.now() - t0} solutionRows=${r.rowCount}`);
    } catch (e) {
      failed++;
      console.log(`FAIL ${id}: ${e.message}`);
    }
    await db.close();
  }
}
process.exit(failed ? 1 : 0);


