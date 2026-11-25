import type { DbLab } from "./types";

/** Categories 3-4: aggregates (part 2) and sorting/grouping. */
export const LABS_AGG2: DbLab[] = [
  {
    id: 2356,
    issue: "1,500 teachers teaching 60 subjects across 30 departments; the same subject appears in many rows.",
    seed: `
CREATE TABLE Teacher (teacher_id INT, subject_id INT, dept_id INT);
INSERT INTO Teacher
SELECT 1 + floor(random() * 1500)::int, 1 + floor(random() * 60)::int, 1 + floor(random() * 30)::int
FROM generate_series(1, 25000);
`,
  },
  {
    id: 1141,
    issue: "50,000 user sessions over two years; only the last 30 days before 2019-07-27 matter.",
    seed: `
CREATE TABLE Activity (user_id INT, session_id INT, activity_date DATE, activity_type TEXT);
INSERT INTO Activity
SELECT 1 + floor(random() * 6000)::int, g, DATE '2018-07-27' + floor(random() * 730)::int,
       (ARRAY['open_session','end_session','scroll_down','send_message'])[1 + floor(random() * 4)::int]
FROM generate_series(1, 50000) g;
`,
  },
  {
    id: 1070,
    issue: "40,000 sales rows over 400 products and 6 years; find each product's first-year sales.",
    seed: `
CREATE TABLE Sales (sale_id INT, product_id INT, year INT, quantity INT, price INT);
INSERT INTO Sales
SELECT g, 1 + floor(random() * 400)::int, 2012 + floor(random() * 6)::int,
       1 + floor(random() * 50)::int, 5 + floor(random() * 300)::int
FROM generate_series(1, 40000) g;
`,
  },
  {
    id: 596,
    issue: "60,000 enrolments across 120 classes; the same student sometimes appears twice in one class.",
    seed: `
CREATE TABLE Courses (student TEXT, class TEXT);
INSERT INTO Courses
SELECT 'student_' || (1 + floor(random() * 3000)::int), 'class_' || (1 + floor(random() * 120)::int)
FROM generate_series(1, 60000);
`,
  },
  {
    id: 1729,
    issue: "50,000 follow relations among 8,000 users; every user must still be countable.",
    seed: `
CREATE TABLE Followers (user_id INT, follower_id INT);
INSERT INTO Followers
SELECT DISTINCT 1 + floor(power(random(), 2) * 8000)::int, 1 + floor(random() * 8000)::int
FROM generate_series(1, 55000);
`,
  },
  {
    id: 619,
    issue: "30,000 numbers where many repeat; only numbers appearing exactly once count.",
    seed: `
CREATE TABLE MyNumbers (num INT);
INSERT INTO MyNumbers SELECT floor(random() * 25000)::int FROM generate_series(1, 30000);
`,
  },
  {
    id: 1045,
    issue: "6,000 customers buying from 40 products; few customers bought every product.",
    seed: `
CREATE TABLE Product (product_key INT PRIMARY KEY);
CREATE TABLE Customer (customer_id INT, product_key INT);
INSERT INTO Product SELECT g FROM generate_series(1, 40) g;
INSERT INTO Customer
SELECT c, p FROM generate_series(1, 6000) c, generate_series(1, 40) p
WHERE random() < CASE WHEN c % 200 = 0 THEN 1 ELSE 0.45 END;
`,
  },
  {
    id: 1731,
    issue: "20,000 employees in a reporting tree where managers have varied team sizes and ages.",
    seed: `
CREATE TABLE Employees (employee_id INT PRIMARY KEY, name TEXT, reports_to INT, age INT);
INSERT INTO Employees
SELECT g, 'emp_' || g, CASE WHEN g > 1500 THEN 1 + floor(random() * 1500)::int END,
       22 + floor(random() * 40)::int
FROM generate_series(1, 20000) g;
`,
  },
];
