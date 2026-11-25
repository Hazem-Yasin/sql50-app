import type { DbLab } from "./types";

/** Category 3: Basic Aggregate Functions (part 1). */
export const LABS_AGG1: DbLab[] = [
  {
    id: 620,
    issue: "10,000 movies; roughly half are 'boring', and odd ids are mixed with high and low ratings.",
    seed: `
CREATE TABLE Cinema (id INT PRIMARY KEY, movie TEXT, description TEXT, rating NUMERIC);
INSERT INTO Cinema
SELECT g, 'movie_' || g, CASE WHEN random() < 0.5 THEN 'boring' ELSE 'fun ' || g END,
       round((random() * 10)::numeric, 1)
FROM generate_series(1, 10000) g;
`,
  },
  {
    id: 1251,
    issue: "300 products with price periods and 40,000 unit-sale records, some outside any price period.",
    seed: `
CREATE TABLE Prices (product_id INT, start_date DATE, end_date DATE, price INT);
CREATE TABLE UnitsSold (product_id INT, purchase_date DATE, units INT);
INSERT INTO Prices
SELECT p, DATE '2019-01-01' + (q * 90), DATE '2019-01-01' + (q * 90) + 89, 10 + floor(random() * 90)::int
FROM generate_series(1, 300) p, generate_series(0, 3) q;
INSERT INTO UnitsSold
SELECT 1 + floor(random() * 320)::int, DATE '2019-01-01' + floor(random() * 400)::int,
       1 + floor(random() * 100)::int
FROM generate_series(1, 40000);
`,
  },
  {
    id: 1075,
    issue: "500 projects staffed from 5,000 employees (20,000 assignments).",
    seed: `
CREATE TABLE Project (project_id INT, employee_id INT);
CREATE TABLE Employee (employee_id INT PRIMARY KEY, name TEXT, experience_years INT);
INSERT INTO Employee SELECT g, 'emp_' || g, floor(random() * 20)::int FROM generate_series(1, 5000) g;
INSERT INTO Project
SELECT DISTINCT 1 + floor(random() * 500)::int, 1 + floor(random() * 5000)::int
FROM generate_series(1, 22000);
`,
  },
  {
    id: 1633,
    issue: "20,000 users and 15 contests, with 80,000 registrations spread unevenly.",
    seed: `
CREATE TABLE Users (user_id INT PRIMARY KEY, user_name TEXT);
CREATE TABLE Register (contest_id INT, user_id INT);
INSERT INTO Users SELECT g, 'user_' || g FROM generate_series(1, 20000) g;
INSERT INTO Register
SELECT DISTINCT 1 + floor(power(random(), 2) * 15)::int, 1 + floor(random() * 20000)::int
FROM generate_series(1, 90000);
`,
  },
  {
    id: 1211,
    issue: "50,000 query results from 40 search queries; poor results have rating below 3.",
    seed: `
CREATE TABLE Queries (query_name TEXT, result TEXT, position INT, rating INT);
INSERT INTO Queries
SELECT 'query_' || (1 + floor(random() * 40)::int), 'result_' || g,
       1 + floor(random() * 500)::int, 1 + floor(random() * 5)::int
FROM generate_series(1, 50000) g;
`,
  },
  {
    id: 1193,
    issue: "60,000 transactions across 30 countries over 3 years, with approved and declined states.",
    seed: `
CREATE TABLE Transactions (id INT PRIMARY KEY, country TEXT, state TEXT, amount INT, trans_date DATE);
INSERT INTO Transactions
SELECT g, 'country_' || (1 + floor(random() * 30)::int),
       CASE WHEN random() < 0.7 THEN 'approved' ELSE 'declined' END,
       10 + floor(random() * 5000)::int, DATE '2019-01-01' + floor(random() * 1095)::int
FROM generate_series(1, 60000) g;
`,
  },
  {
    id: 1174,
    issue: "25,000 delivery orders from 4,000 customers; first orders are mixed immediate and scheduled.",
    seed: `
CREATE TABLE Delivery (delivery_id INT PRIMARY KEY, customer_id INT, order_date DATE, customer_pref_delivery_date DATE);
INSERT INTO Delivery
SELECT g, 1 + floor(random() * 4000)::int, d, d + CASE WHEN random() < 0.4 THEN 0 ELSE 1 + floor(random() * 5)::int END
FROM (SELECT g, DATE '2019-01-01' + floor(random() * 700)::int AS d FROM generate_series(1, 25000) g) t;
`,
  },
  {
    id: 550,
    issue: "8,000 players with 60,000 play records; some return the day after their first login.",
    seed: `
CREATE TABLE Activity (player_id INT, device_id INT, event_date DATE, games_played INT);
INSERT INTO Activity
SELECT p, 1 + (p % 50), DATE '2016-01-01' + (p % 30) + CASE WHEN random() < 0.35 THEN 1 ELSE floor(random() * 20)::int END,
       floor(random() * 15)::int
FROM generate_series(1, 8000) p, generate_series(1, 8) k;
`,
  },
];
