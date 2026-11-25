import type { DbLab } from "./types";

/** Categories 6-7: advanced selects (part 2) and string processing. */
export const LABS_ADV2: DbLab[] = [
  {
    id: 602,
    issue: "6,000 users and 40,000 accepted friend requests; find who has the most friends.",
    seed: `
CREATE TABLE RequestAccepted (requester_id INT, accepter_id INT, accept_date DATE);
INSERT INTO RequestAccepted
SELECT DISTINCT a, b, DATE '2020-01-01' + floor(random() * 365)::int
FROM (SELECT 1 + floor(power(random(), 2) * 6000)::int AS a, 1 + floor(random() * 6000)::int AS b
      FROM generate_series(1, 45000)) t
WHERE a <> b;
`,
  },
  {
    id: 585,
    issue: "40,000 insurance policies with clustered locations and repeated 2015 values.",
    seed: `
CREATE TABLE Insurance (pid INT PRIMARY KEY, tiv_2015 NUMERIC, tiv_2016 NUMERIC, lat NUMERIC, lon NUMERIC);
INSERT INTO Insurance
SELECT g, 10 + floor(random() * 200), 10 + floor(random() * 500),
       floor(random() * 120), floor(random() * 120)
FROM generate_series(1, 40000) g;
`,
  },
  {
    id: 185,
    issue: "30,000 employees across 40 departments with many salary ties; top three distinct salaries per department.",
    seed: `
CREATE TABLE Department (id INT PRIMARY KEY, name TEXT);
CREATE TABLE Employee (id INT PRIMARY KEY, name TEXT, salary INT, departmentId INT);
INSERT INTO Department SELECT g, 'dept_' || g FROM generate_series(1, 40) g;
INSERT INTO Employee
SELECT g, 'emp_' || g, 30000 + (floor(random() * 60)::int * 1000), 1 + floor(random() * 40)::int
FROM generate_series(1, 30000) g;
`,
  },
  {
    id: 1667,
    issue: "20,000 users whose names have messy casing (alice, BOB, cHaRlie).",
    seed: `
CREATE TABLE Users (user_id INT PRIMARY KEY, name TEXT);
INSERT INTO Users
SELECT g, CASE g % 3 WHEN 0 THEN lower(n) WHEN 1 THEN upper(n) ELSE lower(left(n, 1)) || upper(substr(n, 2)) END
FROM (SELECT g, (ARRAY['alice','bob','charlie','diana','edward','fiona'])[1 + g % 6] || g AS n
      FROM generate_series(1, 20000) g) t;
`,
  },
  {
    id: 1527,
    issue: "25,000 patients with condition lists; about 3% carry a DIAB1 code, some only mid-list.",
    seed: `
CREATE TABLE Patients (patient_id INT PRIMARY KEY, patient_name TEXT, conditions TEXT);
INSERT INTO Patients
SELECT g, 'patient_' || g,
       trim(concat_ws(' ',
         CASE WHEN random() < 0.30 THEN 'ACNE' END,
         CASE WHEN random() < 0.03 THEN 'DIAB1' || floor(random() * 3)::int END,
         CASE WHEN random() < 0.20 THEN 'HYPER' END,
         CASE WHEN random() < 0.02 THEN 'XDIAB100' END))
FROM generate_series(1, 25000) g;
`,
  },
  {
    id: 196,
    issue: "30,000 people rows where about a third of emails are duplicated, each with a different id.",
    seed: `
CREATE TABLE Person (id INT PRIMARY KEY, email TEXT);
INSERT INTO Person SELECT g, 'user' || floor(random() * 20000)::int || '@example.com' FROM generate_series(1, 30000) g;
`,
  },
  {
    id: 176,
    issue: "20,000 salaries with many ties at the top; find the second highest distinct value.",
    seed: `
CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);
INSERT INTO Employee SELECT g, 30000 + floor(random() * 500)::int * 100 FROM generate_series(1, 20000) g;
`,
  },
  {
    id: 1484,
    issue: "50,000 sales of 30 products over 2 years; list products sold per date, deduplicated and sorted.",
    seed: `
CREATE TABLE Activities (sell_date DATE, product TEXT);
INSERT INTO Activities
SELECT DATE '2020-01-01' + floor(random() * 730)::int, 'product_' || (1 + floor(random() * 30)::int)
FROM generate_series(1, 50000);
`,
  },
  {
    id: 1327,
    issue: "1,000 products and 60,000 orders over 2 years; find products with 100+ units in February 2020.",
    seed: `
CREATE TABLE Products (product_id INT PRIMARY KEY, product_name TEXT, product_category TEXT);
CREATE TABLE Orders (product_id INT, order_date DATE, unit INT);
INSERT INTO Products SELECT g, 'product_' || g, 'category_' || (g % 12) FROM generate_series(1, 1000) g;
INSERT INTO Orders
SELECT 1 + floor(random() * 1000)::int, DATE '2019-06-01' + floor(random() * 730)::int, 1 + floor(random() * 40)::int
FROM generate_series(1, 60000);
`,
  },
  {
    id: 1517,
    issue: "40,000 users with a mix of valid and invalid email addresses (bad prefix, wrong domain, spaces).",
    seed: `
CREATE TABLE Users (user_id INT PRIMARY KEY, name TEXT, mail TEXT);
INSERT INTO Users
SELECT g, 'user_' || g,
       CASE floor(random() * 6)::int
         WHEN 0 THEN 'valid_' || g || '@leetcode.com'
         WHEN 1 THEN 'ok.name-' || g || '@leetcode.com'
         WHEN 2 THEN '1bad' || g || '@leetcode.com'
         WHEN 3 THEN 'user' || g || '@gmail.com'
         WHEN 4 THEN 'bad name' || g || '@leetcode.com'
         ELSE 'user' || g || '@leetcode.com' END
FROM generate_series(1, 40000) g;
`,
  },
];
