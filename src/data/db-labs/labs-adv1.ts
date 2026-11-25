import type { DbLab } from "./types";

/** Categories 5-6: subqueries and advanced selects (part 1). */
export const LABS_ADV1: DbLab[] = [
  {
    id: 1789,
    issue: "9,000 employees in 25 departments; some belong to several, with exactly one flagged primary.",
    seed: `
CREATE TABLE Employee (employee_id INT, department_id INT, primary_flag CHAR(1));
INSERT INTO Employee
SELECT e, d, CASE WHEN d = (e % 25) + 1 OR (k = 1 AND NOT multi) THEN 'Y' ELSE 'N' END
FROM (SELECT e, (e % 25) + 1 AS home, (e % 3 = 0) AS multi FROM generate_series(1, 9000) e) x,
     LATERAL (SELECT home AS d, 1 AS k UNION ALL SELECT ((home + 6) % 25) + 1, 2 WHERE multi) y(d, k);
`,
  },
  {
    id: 610,
    issue: "20,000 side-length triples; roughly half cannot form a triangle.",
    seed: `
CREATE TABLE Triangle (x INT, y INT, z INT);
INSERT INTO Triangle
SELECT 1 + floor(random() * 50)::int, 1 + floor(random() * 50)::int, 1 + floor(random() * 100)::int
FROM generate_series(1, 20000);
`,
  },
  {
    id: 180,
    issue: "30,000 log rows where the number repeats in streaks of different lengths.",
    seed: `
CREATE TABLE Logs (id INT PRIMARY KEY, num INT);
INSERT INTO Logs SELECT g, floor(g / (1 + (g % 7))::numeric)::int % 6 FROM generate_series(1, 30000) g;
`,
  },
  {
    id: 1164,
    issue: "800 products with 12,000 price changes over 3 years; the price on 2019-08-16 is needed.",
    seed: `
CREATE TABLE Products (product_id INT, new_price INT, change_date DATE);
INSERT INTO Products
SELECT 1 + floor(random() * 800)::int, 5 + floor(random() * 500)::int,
       DATE '2017-01-01' + floor(random() * 1095)::int
FROM generate_series(1, 12000);
`,
  },
  {
    id: 1204,
    issue: "5,000 people queue for a 1000 kg bus, with random weights; find the last who fits.",
    seed: `
CREATE TABLE Queue (person_id INT PRIMARY KEY, person_name TEXT, weight INT, turn INT);
INSERT INTO Queue SELECT g, 'person_' || g, 1 + floor(random() * 4)::int, g FROM generate_series(1, 5000) g;
`,
  },
  {
    id: 1907,
    issue: "30,000 bank accounts with incomes spread around the 20,000 and 50,000 thresholds.",
    seed: `
CREATE TABLE Accounts (account_id INT PRIMARY KEY, income INT);
INSERT INTO Accounts SELECT g, floor(random() * 120000)::int FROM generate_series(1, 30000) g;
`,
  },
  {
    id: 1978,
    issue: "15,000 employees; some managers have left the company, leaving orphaned reports.",
    seed: `
CREATE TABLE Employees (employee_id INT PRIMARY KEY, name TEXT, manager_id INT, salary INT);
INSERT INTO Employees
SELECT g, 'emp_' || g, CASE WHEN g > 1000 AND random() < 0.8 THEN 1 + floor(random() * 1500)::int END,
       floor(random() * 80000)::int
FROM generate_series(1, 15000) g;
DELETE FROM Employees WHERE employee_id <= 1500 AND random() < 0.25;
`,
  },
  {
    id: 626,
    issue: "20,001 students seated by id; an odd count means the last seat stays as is.",
    seed: `
CREATE TABLE Seat (id INT PRIMARY KEY, student TEXT);
INSERT INTO Seat SELECT g, 'student_' || g FROM generate_series(1, 20001) g;
`,
  },
  {
    id: 1341,
    issue: "3,000 users, 2,000 movies and 80,000 ratings; ties on counts and averages are likely.",
    seed: `
CREATE TABLE Movies (movie_id INT PRIMARY KEY, title TEXT);
CREATE TABLE Users (user_id INT PRIMARY KEY, name TEXT);
CREATE TABLE MovieRating (movie_id INT, user_id INT, rating INT, created_at DATE);
INSERT INTO Movies SELECT g, 'movie_' || g FROM generate_series(1, 2000) g;
INSERT INTO Users SELECT g, 'user_' || g FROM generate_series(1, 3000) g;
INSERT INTO MovieRating
SELECT DISTINCT ON (m, u) m, u, 1 + floor(random() * 5)::int, DATE '2020-01-01' + floor(random() * 90)::int
FROM (SELECT 1 + floor(random() * 2000)::int AS m, 1 + floor(random() * 3000)::int AS u
      FROM generate_series(1, 90000)) t;
`,
  },
  {
    id: 1321,
    issue: "2 years of daily visits with several customers per day; compute a 7-day moving average.",
    seed: `
CREATE TABLE Customer (customer_id INT, name TEXT, visited_on DATE, amount INT);
INSERT INTO Customer
SELECT row_number() OVER (), 'cust_' || (1 + floor(random() * 4000)::int),
       DATE '2019-01-01' + d, 20 + floor(random() * 200)::int
FROM generate_series(0, 729) d, generate_series(1, 20) k;
`,
  },
];
