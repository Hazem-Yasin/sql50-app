import type { DbLab } from "./types";

/** Category 2: Basic Joins. */
export const LABS_JOINS: DbLab[] = [
  {
    id: 1378,
    issue: "8,000 employees but only about 60% have a unique id assigned; the rest must show NULL.",
    seed: `
CREATE TABLE Employees (id INT PRIMARY KEY, name TEXT);
CREATE TABLE EmployeeUNI (id INT PRIMARY KEY, unique_id INT);
INSERT INTO Employees SELECT g, 'emp_' || g FROM generate_series(1, 8000) g;
INSERT INTO EmployeeUNI SELECT g, g * 7 FROM generate_series(1, 8000) g WHERE random() < 0.6;
`,
  },
  {
    id: 1068,
    issue: "30,000 sales across 500 products; some product ids in Sales are looked up in Product.",
    seed: `
CREATE TABLE Sales (sale_id INT, product_id INT, year INT, quantity INT, price INT);
CREATE TABLE Product (product_id INT PRIMARY KEY, product_name TEXT);
INSERT INTO Product SELECT g, 'product_' || g FROM generate_series(1, 500) g;
INSERT INTO Sales
SELECT g, 1 + floor(random() * 500)::int, 2015 + floor(random() * 6)::int,
       1 + floor(random() * 20)::int, 5 + floor(random() * 500)::int
FROM generate_series(1, 30000) g;
`,
  },
  {
    id: 1581,
    issue: "20,000 visits but only a third turned into a transaction; many customers visit repeatedly with nothing bought.",
    seed: `
CREATE TABLE Visits (visit_id INT PRIMARY KEY, customer_id INT);
CREATE TABLE Transactions (transaction_id INT PRIMARY KEY, visit_id INT, amount INT);
INSERT INTO Visits SELECT g, 1 + floor(random() * 3000)::int FROM generate_series(1, 20000) g;
INSERT INTO Transactions
SELECT row_number() OVER (), visit_id, 5 + floor(random() * 300)::int
FROM Visits WHERE random() < 0.33;
`,
  },
  {
    id: 197,
    issue: "Ten years of daily temperatures (3,650 rows); find days warmer than the previous day.",
    seed: `
CREATE TABLE Weather (id INT PRIMARY KEY, recordDate DATE, temperature INT);
INSERT INTO Weather
SELECT g, DATE '2010-01-01' + g, 5 + floor(random() * 30)::int
FROM generate_series(0, 3649) g;
`,
  },
  {
    id: 1661,
    issue: "40 machines with 500 processes each; every process has a start and an end event (40,000 rows).",
    seed: `
CREATE TABLE Activity (machine_id INT, process_id INT, activity_type TEXT, timestamp NUMERIC);
INSERT INTO Activity
SELECT m, p, 'start', round((random() * 100)::numeric, 3)
FROM generate_series(1, 40) m, generate_series(1, 500) p;
INSERT INTO Activity
SELECT m, p, 'end', round((a.timestamp + random() * 5 + 0.1)::numeric, 3)
FROM generate_series(1, 40) m, generate_series(1, 500) p
JOIN LATERAL (SELECT timestamp FROM Activity x
              WHERE x.machine_id = m AND x.process_id = p AND x.activity_type = 'start') a ON true;
`,
  },
  {
    id: 577,
    issue: "12,000 employees; only some have a bonus row, and bonuses are often under 1000 or missing.",
    seed: `
CREATE TABLE Employee (empId INT PRIMARY KEY, name TEXT, supervisor INT, salary INT);
CREATE TABLE Bonus (empId INT PRIMARY KEY, bonus INT);
INSERT INTO Employee
SELECT g, 'emp_' || g, CASE WHEN g > 100 THEN 1 + floor(random() * 100)::int END,
       30000 + floor(random() * 90000)::int
FROM generate_series(1, 12000) g;
INSERT INTO Bonus SELECT g, floor(random() * 5000)::int FROM generate_series(1, 12000) g WHERE random() < 0.4;
`,
  },
  {
    id: 1280,
    issue: "2,000 students, 12 subjects and 60,000 exam attempts; many student/subject pairs have zero attempts.",
    seed: `
CREATE TABLE Students (student_id INT PRIMARY KEY, student_name TEXT);
CREATE TABLE Subjects (subject_name TEXT PRIMARY KEY);
CREATE TABLE Examinations (student_id INT, subject_name TEXT);
INSERT INTO Students SELECT g, 'student_' || g FROM generate_series(1, 2000) g;
INSERT INTO Subjects SELECT 'subject_' || g FROM generate_series(1, 12) g;
INSERT INTO Examinations
SELECT 1 + floor(random() * 2000)::int, 'subject_' || (1 + floor(random() * 12)::int)
FROM generate_series(1, 60000);
`,
  },
  {
    id: 570,
    issue: "10,000 employees; a few hundred managers each have between 1 and 12 direct reports.",
    seed: `
CREATE TABLE Employee (id INT PRIMARY KEY, name TEXT, department TEXT, managerId INT);
INSERT INTO Employee
SELECT g, 'emp_' || g, 'dept_' || (g % 20),
       CASE WHEN g > 800 THEN 1 + floor(random() * 800)::int END
FROM generate_series(1, 10000) g;
`,
  },
  {
    id: 1934,
    issue: "5,000 signups and 40,000 confirmation attempts; many users timed out and some never tried.",
    seed: `
CREATE TABLE Signups (user_id INT PRIMARY KEY, time_stamp TIMESTAMP);
CREATE TABLE Confirmations (user_id INT, time_stamp TIMESTAMP, action TEXT);
INSERT INTO Signups
SELECT g, TIMESTAMP '2021-01-01' + (random() * 300) * INTERVAL '1 day' FROM generate_series(1, 5000) g;
INSERT INTO Confirmations
SELECT 1 + floor(random() * 4500)::int, TIMESTAMP '2021-01-01' + (random() * 300) * INTERVAL '1 day',
       CASE WHEN random() < 0.4 THEN 'confirmed' ELSE 'timeout' END
FROM generate_series(1, 40000);
`,
  },
];
