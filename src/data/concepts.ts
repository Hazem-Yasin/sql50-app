export type ConceptLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Concept {
  slug: string;
  title: string;
  group: string;
  level: ConceptLevel;
  /** One or two sentences: what it is and why it matters. */
  summary: string;
  /** Longer explanation, one paragraph per entry. */
  explanation: string[];
  /** A short PostgreSQL example. */
  example: { sql: string; note: string };
  /** Mistakes beginners often make. */
  pitfalls: string[];
  /** LeetCode ids (from the SQL 50 plan) whose solution uses this concept. */
  problems: number[];
  /** Slugs of concepts worth knowing first. */
  prerequisites: string[];
}

export const conceptGroups = [
  "Querying basics",
  "Filtering and NULL",
  "Functions",
  "Joins",
  "Aggregation",
  "Subqueries and sets",
  "Advanced",
] as const;

export const concepts: Concept[] = [
  // ------------------------------------------------------------------
  // Querying basics
  // ------------------------------------------------------------------
  {
    slug: "select-from",
    title: "SELECT and FROM",
    group: "Querying basics",
    level: "Beginner",
    summary: "SELECT chooses the columns you want. FROM says which table they come from.",
    explanation: [
      "Every query starts from a table (FROM) and returns some of its columns (SELECT). SELECT * returns all columns, but naming the columns you need is clearer and faster.",
      "You can also compute new columns in SELECT, such as price * quantity, and rename any column with AS.",
    ],
    example: {
      sql: "SELECT name, population\nFROM World;",
      note: "Returns two columns for every row of World.",
    },
    pitfalls: [
      "SELECT * hides which columns you really use and breaks when the table changes.",
      "The order of columns in the output follows the order in SELECT, not the table.",
    ],
    problems: [1757, 584, 595, 1148, 1683, 1378, 1068],
    prerequisites: [],
  },
  {
    slug: "aliases",
    title: "Aliases (AS)",
    group: "Querying basics",
    level: "Beginner",
    summary: "An alias gives a column or table a new name inside a query.",
    explanation: [
      "A column alias renames a column in the output: SELECT author_id AS id. The output column is called id.",
      "A table alias is a short name used only inside the query: FROM Employees e. Table aliases are required when the same table appears twice (a self join), and they keep joins readable.",
      "AS is optional for both: FROM Employees e and FROM Employees AS e mean the same thing.",
    ],
    example: {
      sql: "SELECT author_id AS id\nFROM Views;",
      note: "The result column is named id, which LeetCode often requires.",
    },
    pitfalls: [
      "You cannot use a column alias in WHERE of the same query, because WHERE runs before SELECT.",
      "Aliases written in double quotes keep their case in PostgreSQL. Unquoted names are folded to lower case.",
    ],
    problems: [1148, 1378, 1068, 197, 1661, 180, 185, 176],
    prerequisites: ["select-from"],
  },
  {
    slug: "order-by-limit",
    title: "ORDER BY, LIMIT and OFFSET",
    group: "Querying basics",
    level: "Beginner",
    summary: "ORDER BY sorts the result. LIMIT keeps only the first rows. OFFSET skips rows first.",
    explanation: [
      "Without ORDER BY, SQL does not promise any row order. Add ORDER BY whenever the order matters.",
      "ORDER BY x DESC sorts from high to low. You can list several columns: ORDER BY a DESC, b. The second one breaks ties in the first.",
      "LIMIT 1 keeps the top row. LIMIT 1 OFFSET 1 skips the top row and returns the second one, which is how you find the second highest value.",
    ],
    example: {
      sql: "SELECT DISTINCT salary\nFROM Employee\nORDER BY salary DESC\nLIMIT 1 OFFSET 1;",
      note: "The second highest distinct salary.",
    },
    pitfalls: [
      "LIMIT without ORDER BY returns an arbitrary row.",
      "If there is no second row, the subquery returns nothing. Wrap it in a scalar subquery to get NULL (problem 176).",
    ],
    problems: [1148, 620, 1633, 1729, 1204, 1341, 602, 176, 1484],
    prerequisites: ["select-from"],
  },
  {
    slug: "distinct",
    title: "DISTINCT",
    group: "Querying basics",
    level: "Beginner",
    summary: "DISTINCT removes duplicate rows from the result.",
    explanation: [
      "SELECT DISTINCT author_id returns each author once, even if there are many rows for them.",
      "DISTINCT applies to the whole row, not just the first column. DISTINCT inside an aggregate, such as COUNT(DISTINCT subject_id), counts unique values only.",
    ],
    example: {
      sql: "SELECT teacher_id, COUNT(DISTINCT subject_id) AS cnt\nFROM Teacher\nGROUP BY teacher_id;",
      note: "Counts each subject once per teacher.",
    },
    pitfalls: [
      "DISTINCT is often used to hide a join that duplicates rows. Fix the join instead.",
      "COUNT(DISTINCT x) ignores NULL values.",
    ],
    problems: [1148, 2356, 1141, 1045, 180, 176, 1484, 550],
    prerequisites: ["select-from"],
  },

  // ------------------------------------------------------------------
  // Filtering and NULL
  // ------------------------------------------------------------------
  {
    slug: "where-and-operators",
    title: "WHERE, comparison and logical operators",
    group: "Filtering and NULL",
    level: "Beginner",
    summary: "WHERE keeps only the rows that match a condition.",
    explanation: [
      "Conditions use =, <>, <, <=, >, >=. Combine them with AND, OR and NOT. AND is evaluated before OR, so use brackets when you mix them.",
      "WHERE runs before grouping, so it filters individual rows. To filter groups, use HAVING instead.",
    ],
    example: {
      sql: "SELECT name, population, area\nFROM World\nWHERE area >= 3000000 OR population >= 25000000;",
      note: "Rows that satisfy either condition.",
    },
    pitfalls: [
      "a OR b AND c means a OR (b AND c). Add brackets so the meaning is clear.",
      "Use = for equality in SQL, never ==.",
    ],
    problems: [1757, 595, 620, 1327, 1141, 1907, 610, 1978],
    prerequisites: ["select-from"],
  },
  {
    slug: "null-handling",
    title: "NULL and three-valued logic",
    group: "Filtering and NULL",
    level: "Beginner",
    summary: "NULL means unknown. It is not equal to anything, not even another NULL.",
    explanation: [
      "Any comparison with NULL gives unknown, and WHERE keeps only rows where the condition is true. So referee_id <> 2 silently drops rows where referee_id is NULL.",
      "Test for NULL with IS NULL and IS NOT NULL. IS DISTINCT FROM is a null-safe version of <>: it treats NULL as a normal value.",
      "NOT IN is dangerous with NULLs: if the list contains a NULL, the condition is never true. Filter the NULLs out of the subquery or use NOT EXISTS.",
    ],
    example: {
      sql: "SELECT name\nFROM Customer\nWHERE referee_id IS DISTINCT FROM 2;",
      note: "Keeps customers whose referee is not 2, including those with no referee.",
    },
    pitfalls: [
      "x = NULL is never true. Use IS NULL.",
      "NOT IN with a subquery that returns a NULL returns no rows at all.",
      "Aggregates such as SUM and AVG skip NULLs, and return NULL when every value is NULL.",
    ],
    problems: [584, 1581, 577, 1211, 1978],
    prerequisites: ["where-and-operators"],
  },
  {
    slug: "between-in-like",
    title: "BETWEEN, IN and LIKE",
    group: "Filtering and NULL",
    level: "Beginner",
    summary: "Shortcuts for ranges, lists and simple text patterns.",
    explanation: [
      "BETWEEN a AND b includes both ends. It is the same as >= a AND <= b.",
      "IN (1, 2, 3) matches any value in the list, and also works with a subquery or with several columns: (product_id, year) IN (SELECT ...).",
      "LIKE matches text patterns. % means any number of characters and _ means exactly one. In PostgreSQL, LIKE is case sensitive and ILIKE is not.",
    ],
    example: {
      sql: "SELECT patient_id, patient_name, conditions\nFROM Patients\nWHERE conditions LIKE 'DIAB1%'\n   OR conditions LIKE '% DIAB1%';",
      note: "A word starting with DIAB1, at the start of the text or after a space.",
    },
    pitfalls: [
      "BETWEEN on dates includes the end date. For timestamps, prefer >= start AND < next_day.",
      "LIKE '%x%' cannot use a normal index, so it is slow on large tables.",
    ],
    problems: [1251, 1141, 1907, 1321, 1174, 1070, 1789, 1978, 1527],
    prerequisites: ["where-and-operators"],
  },
  {
    slug: "regex",
    title: "Regular expressions",
    group: "Filtering and NULL",
    level: "Intermediate",
    summary: "Regular expressions match complex text patterns that LIKE cannot express.",
    explanation: [
      "In PostgreSQL the operator ~ tests a regular expression, and ~* ignores case. In MySQL the equivalent is REGEXP.",
      "^ anchors the start, $ anchors the end, [A-Za-z] is a character class, and a backslash escapes a special character such as the dot in .com.",
    ],
    example: {
      sql: "SELECT *\nFROM Users\nWHERE mail ~ '^[A-Za-z][A-Za-z0-9_.-]*@leetcode\\.com$';",
      note: "Starts with a letter, then letters, digits, underscore, dot or dash, then @leetcode.com.",
    },
    pitfalls: [
      "An unescaped dot matches any character, so write \\. for a real dot.",
      "Without ^ and $, the pattern can match anywhere inside the text.",
      "Regex syntax differs between PostgreSQL, MySQL and SQL Server.",
    ],
    problems: [1517],
    prerequisites: ["between-in-like"],
  },

  // ------------------------------------------------------------------
  // Functions
  // ------------------------------------------------------------------
  {
    slug: "string-functions",
    title: "String functions",
    group: "Functions",
    level: "Beginner",
    summary: "Functions that measure, cut and change text.",
    explanation: [
      "LENGTH(text) returns the number of characters. UPPER and LOWER change case. LEFT(text, n) returns the first n characters and SUBSTRING(text FROM 2) returns everything from the second character.",
      "|| joins strings in PostgreSQL. STRING_AGG(value, ',' ORDER BY value) joins the values of many rows into one string.",
    ],
    example: {
      sql: "SELECT user_id,\n       UPPER(LEFT(name, 1)) || LOWER(SUBSTRING(name FROM 2)) AS name\nFROM Users;",
      note: "Capitalises the first letter and lower-cases the rest.",
    },
    pitfalls: [
      "Function names and joining syntax differ: MySQL uses CONCAT and SUBSTR, SQL Server uses + and SUBSTRING(x, 2, LEN(x)).",
      "Joining a string with NULL using || gives NULL.",
    ],
    problems: [1683, 1667, 1484, 1729],
    prerequisites: ["select-from"],
  },
  {
    slug: "case-when",
    title: "CASE WHEN",
    group: "Functions",
    level: "Beginner",
    summary: "CASE is SQL's if / else. It returns different values depending on conditions.",
    explanation: [
      "CASE WHEN condition THEN value ... ELSE value END checks the conditions in order and returns the first match. Without an ELSE, no match gives NULL.",
      "You can use CASE inside aggregates to count or sum only some rows, for example SUM(CASE WHEN state = 'approved' THEN 1 ELSE 0 END).",
    ],
    example: {
      sql: "SELECT x, y, z,\n       CASE WHEN x + y > z AND x + z > y AND y + z > x\n            THEN 'Yes' ELSE 'No' END AS triangle\nFROM Triangle;",
      note: "A triangle exists only if each pair of sides is longer than the third.",
    },
    pitfalls: [
      "Forgetting END, or forgetting ELSE and getting unexpected NULLs.",
      "The first matching WHEN wins, so order matters.",
    ],
    problems: [610, 626],
    prerequisites: ["where-and-operators"],
  },
  {
    slug: "coalesce-nullif-cast",
    title: "COALESCE, NULLIF and CAST",
    group: "Functions",
    level: "Intermediate",
    summary: "Tools for replacing NULLs, avoiding division by zero and changing data types.",
    explanation: [
      "COALESCE(a, b, c) returns the first value that is not NULL. It is the standard way to turn NULL into 0 or a default.",
      "NULLIF(a, b) returns NULL when a equals b. NULLIF(x, 0) turns a zero divisor into NULL, so the division returns NULL instead of an error.",
      "CAST(x AS numeric) or x::numeric converts a type. This matters because integer / integer is integer division in PostgreSQL: 1 / 2 is 0.",
    ],
    example: {
      sql: "SELECT p.product_id,\n       COALESCE(ROUND(SUM(p.price * u.units)::numeric\n                      / NULLIF(SUM(u.units), 0), 2), 0) AS average_price\nFROM Prices p\nLEFT JOIN UnitsSold u\n       ON p.product_id = u.product_id\n      AND u.purchase_date BETWEEN p.start_date AND p.end_date\nGROUP BY p.product_id;",
      note: "Products with no sales get 0 instead of NULL or a division error.",
    },
    pitfalls: [
      "Integer division silently truncates. Cast one side to numeric or multiply by 1.0 first.",
      "The result of COALESCE must have a compatible type with all its arguments.",
    ],
    problems: [1934, 1251, 1193, 1164, 1211, 1174, 550, 585],
    prerequisites: ["null-handling"],
  },
  {
    slug: "math-and-rounding",
    title: "Maths and ROUND",
    group: "Functions",
    level: "Beginner",
    summary: "Arithmetic operators, modulo and rounding.",
    explanation: [
      "+ - * / work as usual. % is the remainder (modulo), so id % 2 = 1 selects odd ids.",
      "ROUND(x, 2) rounds to two decimals. In PostgreSQL, ROUND with two arguments needs a numeric value, so cast a double precision value first.",
      "Percentages: multiply by 100.0 (with a decimal point) so the result is not truncated to an integer.",
    ],
    example: {
      sql: "SELECT contest_id,\n       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Users), 2) AS percentage\nFROM Register\nGROUP BY contest_id;",
      note: "The share of all users who registered for each contest.",
    },
    pitfalls: [
      "COUNT(*) * 100 / total with integers truncates. Use 100.0.",
      "ROUND(double precision, 2) does not exist in PostgreSQL. Cast with ::numeric.",
    ],
    problems: [620, 626, 1633, 1661, 1934, 1251, 1075, 1211, 1174, 550, 1731, 1321, 585],
    prerequisites: ["select-from"],
  },
  {
    slug: "date-functions",
    title: "Dates and intervals",
    group: "Functions",
    level: "Intermediate",
    summary: "Compare dates, add days, and format or group by month.",
    explanation: [
      "In PostgreSQL you can add days to a date with +: recordDate + 1 is the next day. For other units use intervals: date + INTERVAL '6 days'.",
      "TO_CHAR(date, 'YYYY-MM') turns a date into a text such as 2020-02, which is handy for grouping by month. In MySQL the same job is done by DATE_FORMAT.",
      "For a month filter, prefer date >= '2020-02-01' AND date < '2020-03-01'. It works for dates and timestamps and can use an index.",
    ],
    example: {
      sql: "SELECT today.id\nFROM Weather today\nJOIN Weather yesterday\n  ON today.recordDate = yesterday.recordDate + 1\nWHERE today.temperature > yesterday.temperature;",
      note: "Matches each day with the day before it.",
    },
    pitfalls: [
      "Date functions are very different in MySQL (DATE_ADD, DATEDIFF) and SQL Server (DATEADD, DATEDIFF).",
      "Comparing a timestamp with BETWEEN and a date can miss the last day.",
    ],
    problems: [197, 1193, 550, 1141, 1164, 1327, 1341, 1321, 180],
    prerequisites: ["where-and-operators"],
  },

  // ------------------------------------------------------------------
  // Joins
  // ------------------------------------------------------------------
  {
    slug: "inner-join",
    title: "INNER JOIN",
    group: "Joins",
    level: "Beginner",
    summary: "Combines rows from two tables and keeps only the rows that match in both.",
    explanation: [
      "A join pairs each row of one table with the rows of another table that satisfy the ON condition, usually equal keys such as s.product_id = p.product_id.",
      "JOIN on its own means INNER JOIN. Rows that have no match on the other side disappear from the result.",
      "If one row matches several rows on the other side, it appears several times. This is how joins multiply rows, and why you often need GROUP BY afterwards.",
    ],
    example: {
      sql: "SELECT p.product_name, s.year, s.price\nFROM Sales s\nJOIN Product p ON s.product_id = p.product_id;",
      note: "Every sale together with the name of its product.",
    },
    pitfalls: [
      "A missing ON condition makes a cross join: every row paired with every row.",
      "Use table aliases and prefix the columns (s.price) so it is clear where each comes from.",
    ],
    problems: [1068, 1661, 1075, 570, 1731, 1341, 185, 1327],
    prerequisites: ["select-from", "aliases"],
  },
  {
    slug: "left-join",
    title: "LEFT JOIN (and anti-joins)",
    group: "Joins",
    level: "Beginner",
    summary: "Keeps every row of the left table, with NULLs where the right table has no match.",
    explanation: [
      "Use LEFT JOIN when the left table must be fully kept, such as every employee even if they have no unique id.",
      "To find rows with no match (an anti-join), LEFT JOIN and then filter WHERE right.key IS NULL. This answers questions like which visits had no transaction.",
      "A condition in ON changes which rows match. The same condition in WHERE removes rows after the join, which turns a LEFT JOIN back into an inner join.",
    ],
    example: {
      sql: "SELECT v.customer_id, COUNT(*) AS count_no_trans\nFROM Visits v\nLEFT JOIN Transactions t ON v.visit_id = t.visit_id\nWHERE t.transaction_id IS NULL\nGROUP BY v.customer_id;",
      note: "Counts the visits that had no transaction, per customer.",
    },
    pitfalls: [
      "Putting a filter on the right table in WHERE removes the NULL rows. Put it in ON instead.",
      "Test for no match on a column that is never NULL in the right table, such as its primary key.",
      "RIGHT JOIN is the same as LEFT JOIN with the tables swapped, so most people only use LEFT.",
    ],
    problems: [1378, 1581, 577, 1280, 1934, 1251, 1164],
    prerequisites: ["inner-join", "null-handling"],
  },
  {
    slug: "self-join",
    title: "SELF JOIN",
    group: "Joins",
    level: "Intermediate",
    summary: "Joins a table to itself, using two aliases, to compare one row with another.",
    explanation: [
      "Some questions compare rows of the same table: a day with the previous day, an employee with their manager, or a start row with an end row. Write the table twice with different aliases.",
      "The aliases are only labels. The ON condition gives each copy its meaning, for example today.recordDate = yesterday.recordDate + 1 makes the second copy the previous day.",
      "Chains such as three consecutive values (problem 180) join the table to itself twice, once for each extra row.",
    ],
    example: {
      sql: "SELECT s.machine_id,\n       ROUND(AVG(e.timestamp - s.timestamp), 3) AS processing_time\nFROM Activity s\nJOIN Activity e\n  ON s.machine_id = e.machine_id\n AND s.process_id = e.process_id\nWHERE s.activity_type = 'start'\n  AND e.activity_type = 'end'\nGROUP BY s.machine_id;",
      note: "Puts the start and end timestamps of a process on one row.",
    },
    pitfalls: [
      "Without different aliases, the column names are ambiguous.",
      "Join on dates or keys, not on consecutive ids, because ids can have gaps.",
    ],
    problems: [197, 1661, 1731, 570, 180],
    prerequisites: ["inner-join", "aliases"],
  },
  {
    slug: "cross-join",
    title: "CROSS JOIN",
    group: "Joins",
    level: "Intermediate",
    summary: "Pairs every row of one table with every row of another.",
    explanation: [
      "A cross join produces all combinations. It is useful when you need a row for every pair, even pairs that have no data, such as every student with every subject.",
      "Follow it with a LEFT JOIN to bring in the real data, and COUNT a column from the right table so missing pairs count as 0.",
    ],
    example: {
      sql: "SELECT s.student_id, sub.subject_name,\n       COUNT(e.subject_name) AS attended_exams\nFROM Students s\nCROSS JOIN Subjects sub\nLEFT JOIN Examinations e\n       ON e.student_id = s.student_id\n      AND e.subject_name = sub.subject_name\nGROUP BY s.student_id, sub.subject_name;",
      note: "Every student and subject, with 0 for subjects they never took.",
    },
    pitfalls: [
      "The size is rows(A) times rows(B), so it grows very fast on large tables.",
      "An accidental cross join (a missing ON) is a common bug.",
    ],
    problems: [1280],
    prerequisites: ["inner-join", "left-join"],
  },
  {
    slug: "multi-condition-joins",
    title: "Joining on several conditions or tables",
    group: "Joins",
    level: "Intermediate",
    summary: "Join keys can have several columns, and a query can join many tables.",
    explanation: [
      "Combine conditions in ON with AND, such as machine_id and process_id together, or a key plus a date range.",
      "Chain joins one after another. Each JOIN uses the result of the previous ones. Join conditions can also use BETWEEN to match a value inside a range.",
    ],
    example: {
      sql: "LEFT JOIN UnitsSold u\n       ON p.product_id = u.product_id\n      AND u.purchase_date BETWEEN p.start_date AND p.end_date",
      note: "Matches each sale to the price that was valid on its date.",
    },
    pitfalls: [
      "With LEFT JOIN, extra conditions on the right table belong in ON, not WHERE.",
      "Joining on a non-unique key multiplies rows.",
    ],
    problems: [1661, 1280, 1251, 180],
    prerequisites: ["inner-join"],
  },

  // ------------------------------------------------------------------
  // Aggregation
  // ------------------------------------------------------------------
  {
    slug: "aggregate-functions",
    title: "Aggregate functions",
    group: "Aggregation",
    level: "Beginner",
    summary: "COUNT, SUM, AVG, MIN and MAX turn many rows into one value.",
    explanation: [
      "COUNT(*) counts rows. COUNT(column) counts rows where that column is not NULL. COUNT(DISTINCT column) counts unique non-NULL values.",
      "SUM and AVG ignore NULLs. AVG of a column is not the same as SUM divided by COUNT(*) when the column has NULLs.",
      "Without GROUP BY, an aggregate returns a single row for the whole table.",
    ],
    example: {
      sql: "SELECT ROUND(AVG(experience_years), 2) AS average_years\nFROM Employee;",
      note: "One value for the whole table.",
    },
    pitfalls: [
      "Mixing an aggregate with a plain column in SELECT needs GROUP BY for that column.",
      "SUM over no rows returns NULL, not 0. Wrap it in COALESCE.",
    ],
    problems: [1075, 1633, 1661, 1934, 1251, 1211, 1193, 619, 1204],
    prerequisites: ["select-from"],
  },
  {
    slug: "group-by-having",
    title: "GROUP BY and HAVING",
    group: "Aggregation",
    level: "Beginner",
    summary: "GROUP BY makes one row per group. HAVING filters the groups.",
    explanation: [
      "GROUP BY splits the rows into groups by the listed columns, then aggregates are computed per group. Every selected column must either be in GROUP BY or inside an aggregate.",
      "WHERE filters rows before grouping. HAVING filters after grouping, so it can use aggregates, such as HAVING COUNT(*) >= 5.",
      "Group by the primary key or by every column you display, for example both id and name, to avoid merging two different people who share a name.",
    ],
    example: {
      sql: "SELECT class\nFROM Courses\nGROUP BY class\nHAVING COUNT(student) >= 5;",
      note: "Classes with at least five students.",
    },
    pitfalls: [
      "You cannot use an aggregate in WHERE. Use HAVING.",
      "Grouping only by a name merges people who have the same name.",
    ],
    problems: [570, 596, 1045, 619, 1789, 1327, 2356, 1581, 1729, 1633, 1141],
    prerequisites: ["aggregate-functions", "where-and-operators"],
  },
  {
    slug: "conditional-aggregation",
    title: "Conditional aggregation (CASE and FILTER)",
    group: "Aggregation",
    level: "Intermediate",
    summary: "Count or sum only the rows that meet a condition, inside one GROUP BY query.",
    explanation: [
      "To get several counts in one pass, put a condition inside the aggregate. SUM(CASE WHEN x THEN 1 ELSE 0 END) counts matching rows.",
      "PostgreSQL also has the shorter COUNT(*) FILTER (WHERE x). A boolean can be cast to an integer, so AVG((action = 'confirmed')::int) is the fraction of true values.",
      "This avoids running the same table several times and is the standard trick for rates and percentages.",
    ],
    example: {
      sql: "SELECT TO_CHAR(trans_date, 'YYYY-MM') AS month, country,\n       COUNT(*) AS trans_count,\n       COUNT(*) FILTER (WHERE state = 'approved') AS approved_count\nFROM Transactions\nGROUP BY 1, 2;",
      note: "Two counts, all and approved, in a single scan.",
    },
    pitfalls: [
      "COUNT(CASE WHEN x THEN 1 END) counts the 1s, because COUNT skips NULL. Do not use ELSE 0 with COUNT.",
      "FILTER is PostgreSQL specific. In MySQL and SQL Server use CASE.",
    ],
    problems: [1193, 1907, 1934, 1211, 1174],
    prerequisites: ["group-by-having", "case-when"],
  },

  // ------------------------------------------------------------------
  // Subqueries and sets
  // ------------------------------------------------------------------
  {
    slug: "subqueries",
    title: "Subqueries",
    group: "Subqueries and sets",
    level: "Intermediate",
    summary: "A query inside another query: in WHERE, FROM or SELECT.",
    explanation: [
      "In WHERE, a subquery gives a value or a list to compare with: WHERE x IN (SELECT ...) or WHERE x = (SELECT MAX(...)).",
      "In FROM, a subquery behaves like a temporary table and needs an alias: FROM (SELECT ...) AS t. Use it to compute something first, such as the first year of each product, and then filter or join it.",
      "In SELECT, a scalar subquery returns a single value, such as the total number of users used as a denominator.",
    ],
    example: {
      sql: "SELECT product_id, year AS first_year, quantity, price\nFROM Sales\nWHERE (product_id, year) IN (\n    SELECT product_id, MIN(year)\n    FROM Sales\n    GROUP BY product_id\n);",
      note: "The sale rows from each product's first year.",
    },
    pitfalls: [
      "A scalar subquery that returns more than one row is an error.",
      "A subquery in FROM must have an alias.",
      "NOT IN fails when the subquery returns a NULL. See NULL and three-valued logic.",
    ],
    problems: [1633, 1174, 550, 1070, 619, 1045, 1789, 1164, 1204, 1978, 626, 602, 585, 176],
    prerequisites: ["group-by-having", "null-handling"],
  },
  {
    slug: "union",
    title: "UNION and UNION ALL",
    group: "Subqueries and sets",
    level: "Intermediate",
    summary: "Stacks the results of several queries into one result.",
    explanation: [
      "The queries must return the same number of columns with compatible types. The column names come from the first query.",
      "UNION removes duplicate rows and is slower. UNION ALL keeps everything. Prefer UNION ALL unless you need to remove duplicates.",
      "Use it to build a list from several sources, such as the requesters and the accepters of friend requests, or to produce a fixed set of rows such as three salary categories.",
    ],
    example: {
      sql: "SELECT requester_id AS id FROM RequestAccepted\nUNION ALL\nSELECT accepter_id FROM RequestAccepted;",
      note: "One column with everyone who appears in either role.",
    },
    pitfalls: [
      "ORDER BY and LIMIT inside a branch need brackets around that branch.",
      "UNION does extra work to remove duplicates, which can change counts you wanted to keep.",
    ],
    problems: [1907, 1341, 602],
    prerequisites: ["select-from"],
  },

  // ------------------------------------------------------------------
  // Advanced
  // ------------------------------------------------------------------
  {
    slug: "ctes",
    title: "Common table expressions (WITH)",
    group: "Advanced",
    level: "Intermediate",
    summary: "WITH names a subquery so you can read and reuse it like a table.",
    explanation: [
      "WITH daily AS (SELECT ...) SELECT ... FROM daily defines a temporary named result for the length of one query.",
      "CTEs make multi-step logic readable: compute one step at a time, top to bottom, instead of nesting subqueries inside each other.",
    ],
    example: {
      sql: "WITH daily AS (\n    SELECT visited_on, SUM(amount) AS amount\n    FROM Customer\n    GROUP BY visited_on\n)\nSELECT * FROM daily;",
      note: "First total per day, then use it in the next step.",
    },
    pitfalls: [
      "A CTE is not a stored table. It exists only for that query.",
      "MySQL supports WITH only from version 8.",
    ],
    problems: [1321],
    prerequisites: ["subqueries"],
  },
  {
    slug: "window-functions",
    title: "Window functions",
    group: "Advanced",
    level: "Advanced",
    summary: "Calculations across related rows without collapsing them into one row.",
    explanation: [
      "A window function adds a column computed over a window of rows: function() OVER (PARTITION BY ... ORDER BY ...). Unlike GROUP BY, it keeps every row.",
      "PARTITION BY splits the rows into independent groups, such as one per department. ORDER BY inside OVER sets the order used for ranking and running totals.",
      "SUM(weight) OVER (ORDER BY turn) is a running total. With a frame, such as RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW, it becomes a moving window. COUNT(*) OVER (PARTITION BY x) puts the group size next to each row.",
    ],
    example: {
      sql: "SELECT person_name\nFROM (\n    SELECT person_name,\n           SUM(weight) OVER (ORDER BY turn) AS total_weight\n    FROM Queue\n) t\nWHERE total_weight <= 1000\nORDER BY total_weight DESC\nLIMIT 1;",
      note: "A running total of weight by boarding turn.",
    },
    pitfalls: [
      "You cannot use a window function in WHERE. Compute it in a subquery or CTE, then filter.",
      "Without ORDER BY inside OVER, SUM is the total of the whole partition, not a running total.",
    ],
    problems: [1204, 1321, 585, 185],
    prerequisites: ["subqueries", "group-by-having"],
  },
  {
    slug: "ranking-functions",
    title: "Ranking: ROW_NUMBER, RANK and DENSE_RANK",
    group: "Advanced",
    level: "Advanced",
    summary: "Number rows in order within a group. The three differ in how they treat ties.",
    explanation: [
      "ROW_NUMBER gives each row a unique number, even for ties. RANK gives ties the same number and then skips ahead (1, 1, 3). DENSE_RANK gives ties the same number without skipping (1, 1, 2).",
      "For a top N per group, rank inside each group and keep rank <= N. DENSE_RANK is the one to use for top three salaries, because equal salaries must share a place.",
    ],
    example: {
      sql: "SELECT name, salary, departmentId,\n       DENSE_RANK() OVER (\n           PARTITION BY departmentId\n           ORDER BY salary DESC) AS rnk\nFROM Employee;",
      note: "The rank of each salary inside its department.",
    },
    pitfalls: [
      "Using RANK instead of DENSE_RANK changes which rows pass the top N filter.",
      "The ranking column cannot be used in the same query's WHERE. Filter in an outer query.",
    ],
    problems: [185],
    prerequisites: ["window-functions"],
  },
  {
    slug: "distinct-on",
    title: "Latest row per group (DISTINCT ON)",
    group: "Advanced",
    level: "Advanced",
    summary: "A PostgreSQL shortcut for keeping the first row of each group.",
    explanation: [
      "DISTINCT ON (product_id) keeps one row per product: the first one according to ORDER BY. Order by the group column first, then by the column that decides which row wins, such as change_date DESC for the latest.",
      "The same result can be built with ROW_NUMBER() or with a subquery on MAX(date). DISTINCT ON is PostgreSQL only.",
    ],
    example: {
      sql: "SELECT DISTINCT ON (product_id) product_id, new_price\nFROM Products\nWHERE change_date <= DATE '2019-08-16'\nORDER BY product_id, change_date DESC;",
      note: "The latest price of each product on or before a date.",
    },
    pitfalls: [
      "ORDER BY must start with the DISTINCT ON columns.",
      "Products with no change before the date are missing. Join back to the full product list to add a default.",
    ],
    problems: [1164],
    prerequisites: ["order-by-limit", "left-join"],
  },
  {
    slug: "delete-and-dml",
    title: "DELETE with a join",
    group: "Advanced",
    level: "Intermediate",
    summary: "Changing data, not only reading it: delete the rows you do not want to keep.",
    explanation: [
      "DELETE FROM table WHERE condition removes rows. To compare a row with other rows of the same table, PostgreSQL uses DELETE ... USING. MySQL uses DELETE p FROM Person p JOIN Person q ON ....",
      "A common pattern removes duplicates by keeping the smallest id: delete a row when another row with the same email has a smaller id.",
    ],
    example: {
      sql: "DELETE FROM Person p\nUSING Person q\nWHERE p.email = q.email AND p.id > q.id;",
      note: "Keeps only the row with the lowest id for each email.",
    },
    pitfalls: [
      "A DELETE without WHERE removes every row. Run it as a SELECT first to preview.",
      "LeetCode checks the table after the delete, not a query result.",
    ],
    problems: [196],
    prerequisites: ["self-join"],
  },
];

export function getConcept(slug: string): Concept | undefined {
  return concepts.find((c) => c.slug === slug);
}
