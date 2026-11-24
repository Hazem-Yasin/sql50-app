/**
 * test-cases.ts
 *
 * Self-contained test cases for all 50 LeetCode SQL 50 problems.
 * Each entry has:
 *   - setup: DDL + INSERT statements that create a fresh schema + seed data
 *   - solution: the PostgreSQL solution from problems.json
 *   - expected: the expected result rows (order-independent by default)
 *   - ordered: if true, row order must also match (only for solutions with deterministic ORDER BY)
 *
 * Used by src/lib/verifier.ts to run against an isolated PGlite instance.
 */

export interface TestCase {
  id: number;
  title: string;
  setup: string;
  solution: string;
  expected: Record<string, unknown>[];
  /** When true, row order is compared; default false (set-based comparison). */
  ordered?: boolean;
}

export const TEST_CASES: TestCase[] = [
  // ───────────────────────────── Category 1: Select ──────────────────────────────

  {
    id: 1757,
    title: "Recyclable and Low Fat Products",
    setup: `
      CREATE TABLE Products (product_id INT PRIMARY KEY, low_fats CHAR(1), recyclable CHAR(1));
      INSERT INTO Products VALUES (0,'Y','N'),(1,'Y','Y'),(2,'N','Y'),(3,'Y','Y'),(4,'N','N');
    `,
    solution: `SELECT product_id FROM Products WHERE low_fats = 'Y' AND recyclable = 'Y'`,
    expected: [{ product_id: 1 }, { product_id: 3 }],
  },
  {
    id: 584,
    title: "Find Customer Referee",
    setup: `
      CREATE TABLE Customer (id INT PRIMARY KEY, name TEXT, referee_id INT);
      INSERT INTO Customer VALUES (1,'Will',NULL),(2,'Jane',NULL),(3,'Alex',2),(4,'Bill',NULL),(5,'Zack',1),(6,'Mark',2);
    `,
    solution: `SELECT name FROM Customer WHERE referee_id IS DISTINCT FROM 2`,
    expected: [{ name: "Will" }, { name: "Jane" }, { name: "Bill" }, { name: "Zack" }],
  },
  {
    id: 595,
    title: "Big Countries",
    setup: `
      CREATE TABLE World (name TEXT PRIMARY KEY, continent TEXT, area INT, population INT, gdp BIGINT);
      INSERT INTO World VALUES ('Afghanistan','Asia',652230,25500100,20343000000),('Albania','Europe',28748,2831741,12960000000),('Algeria','Africa',2381741,37100000,188681000000),('Andorra','Europe',468,78115,3712000000),('Angola','Africa',1246700,20609294,100990000000);
    `,
    solution: `SELECT name, population, area FROM World WHERE area >= 3000000 OR population >= 25000000`,
    expected: [
      { name: "Afghanistan", population: 25500100, area: 652230 },
      { name: "Algeria",     population: 37100000, area: 2381741 },
    ],
  },
  {
    id: 1148,
    title: "Article Views I",
    setup: `
      CREATE TABLE Views (article_id INT, author_id INT, viewer_id INT, view_date DATE);
      INSERT INTO Views VALUES (1,3,5,'2019-08-01'),(1,3,6,'2019-08-02'),(2,7,7,'2019-08-01'),(2,7,6,'2019-08-02'),(4,7,1,'2019-07-22'),(3,4,4,'2019-07-21'),(3,4,4,'2019-07-21');
    `,
    solution: `SELECT DISTINCT author_id AS id FROM Views WHERE author_id = viewer_id ORDER BY id`,
    expected: [{ id: 4 }, { id: 7 }],
    ordered: true,
  },
  {
    id: 1683,
    title: "Invalid Tweets",
    setup: `
      CREATE TABLE Tweets (tweet_id INT PRIMARY KEY, content TEXT);
      INSERT INTO Tweets VALUES (1,'Vote for Biden'),(2,'Let us make America great again!');
    `,
    solution: `SELECT tweet_id FROM Tweets WHERE LENGTH(content) > 15`,
    expected: [{ tweet_id: 2 }],
  },

  // ───────────────────────── Category 2: Basic Joins ──────────────────────────────

  {
    id: 1378,
    title: "Replace Employee ID With The Unique Identifier",
    setup: `
      CREATE TABLE Employees (id INT PRIMARY KEY, name TEXT);
      CREATE TABLE EmployeeUNI (id INT PRIMARY KEY, unique_id INT);
      INSERT INTO Employees VALUES (1,'Alice'),(7,'Bob'),(11,'Meir'),(90,'Winston'),(3,'Jonathan');
      INSERT INTO EmployeeUNI VALUES (3,1),(11,2),(90,3);
    `,
    solution: `SELECT eu.unique_id, e.name FROM Employees e LEFT JOIN EmployeeUNI eu ON e.id = eu.id`,
    expected: [
      { unique_id: null, name: "Alice" },
      { unique_id: null, name: "Bob" },
      { unique_id: 2,    name: "Meir" },
      { unique_id: 3,    name: "Winston" },
      { unique_id: 1,    name: "Jonathan" },
    ],
  },
  {
    id: 1068,
    title: "Product Sales Analysis I",
    setup: `
      CREATE TABLE Sales (sale_id INT, product_id INT, year INT, quantity INT, price INT);
      CREATE TABLE Product (product_id INT PRIMARY KEY, product_name TEXT);
      INSERT INTO Sales VALUES (1,100,2008,10,5000),(2,100,2009,12,5000),(7,200,2011,15,9000);
      INSERT INTO Product VALUES (100,'Nokia'),(200,'Apple'),(300,'Samsung');
    `,
    solution: `SELECT p.product_name, s.year, s.price FROM Sales s JOIN Product p ON s.product_id = p.product_id`,
    expected: [
      { product_name: "Nokia", year: 2008, price: 5000 },
      { product_name: "Nokia", year: 2009, price: 5000 },
      { product_name: "Apple", year: 2011, price: 9000 },
    ],
  },
  {
    id: 1581,
    title: "Customer Who Visited but Did Not Make Any Transactions",
    setup: `
      CREATE TABLE Visits (visit_id INT PRIMARY KEY, customer_id INT);
      CREATE TABLE Transactions (transaction_id INT PRIMARY KEY, visit_id INT, amount INT);
      INSERT INTO Visits VALUES (1,23),(2,9),(4,30),(5,54),(6,96),(7,54),(8,54);
      INSERT INTO Transactions VALUES (2,5,310),(3,5,300),(9,5,200),(12,1,910),(13,2,970);
    `,
    solution: `SELECT v.customer_id, COUNT(*) AS count_no_trans FROM Visits v LEFT JOIN Transactions t ON v.visit_id = t.visit_id WHERE t.transaction_id IS NULL GROUP BY v.customer_id`,
    expected: [
      { customer_id: 54, count_no_trans: 2 },
      { customer_id: 30, count_no_trans: 1 },
      { customer_id: 96, count_no_trans: 1 },
    ],
  },
  {
    id: 197,
    title: "Rising Temperature",
    setup: `
      CREATE TABLE Weather (id INT PRIMARY KEY, recordDate DATE, temperature INT);
      INSERT INTO Weather VALUES (1,'2015-01-01',10),(2,'2015-01-02',25),(3,'2015-01-03',20),(4,'2015-01-04',30);
    `,
    solution: `SELECT today.id FROM Weather today JOIN Weather yesterday ON today.recordDate = yesterday.recordDate + 1 WHERE today.temperature > yesterday.temperature`,
    expected: [{ id: 2 }, { id: 4 }],
  },
  {
    id: 1661,
    title: "Average Time of Process per Machine",
    setup: `
      CREATE TABLE Activity (machine_id INT, process_id INT, activity_type TEXT, timestamp NUMERIC);
      INSERT INTO Activity VALUES (0,0,'start',0.712),(0,0,'end',1.520),(0,1,'start',3.140),(0,1,'end',4.120),(1,0,'start',0.550),(1,0,'end',1.550),(1,1,'start',0.430),(1,1,'end',1.420),(2,0,'start',4.100),(2,0,'end',4.512),(2,1,'start',2.500),(2,1,'end',5.000);
    `,
    solution: `SELECT s.machine_id, ROUND(AVG(e.timestamp - s.timestamp)::numeric, 3) AS processing_time FROM Activity s JOIN Activity e ON s.machine_id = e.machine_id AND s.process_id = e.process_id WHERE s.activity_type = 'start' AND e.activity_type = 'end' GROUP BY s.machine_id`,
    expected: [
      { machine_id: 0, processing_time: "0.894" },
      { machine_id: 1, processing_time: "0.995" },
      { machine_id: 2, processing_time: "1.456" },
    ],
  },
  {
    id: 577,
    title: "Employee Bonus",
    setup: `
      CREATE TABLE Employee (empId INT PRIMARY KEY, name TEXT, supervisor INT, salary INT);
      CREATE TABLE Bonus (empId INT PRIMARY KEY, bonus INT);
      INSERT INTO Employee VALUES (3,'Brad',NULL,4000),(1,'John',3,1000),(2,'Dan',3,2000),(4,'Thomas',3,4000);
      INSERT INTO Bonus VALUES (2,500),(4,2000);
    `,
    solution: `SELECT e.name, b.bonus FROM Employee e LEFT JOIN Bonus b ON e.empId = b.empId WHERE b.bonus < 1000 OR b.bonus IS NULL`,
    expected: [
      { name: "Brad",   bonus: null },
      { name: "John",   bonus: null },
      { name: "Dan",    bonus: 500  },
    ],
  },
  {
    id: 1280,
    title: "Students and Examinations",
    setup: `
      CREATE TABLE Students (student_id INT PRIMARY KEY, student_name TEXT);
      CREATE TABLE Subjects (subject_name TEXT PRIMARY KEY);
      CREATE TABLE Examinations (student_id INT, subject_name TEXT);
      INSERT INTO Students VALUES (1,'Alice'),(2,'Bob'),(13,'John'),(6,'Alex');
      INSERT INTO Subjects VALUES ('Math'),('Physics'),('Programming');
      INSERT INTO Examinations VALUES (1,'Math'),(1,'Physics'),(1,'Programming'),(2,'Programming'),(1,'Physics'),(1,'Math');
    `,
    solution: `SELECT s.student_id, s.student_name, sub.subject_name, COUNT(e.subject_name) AS attended_exams FROM Students s CROSS JOIN Subjects sub LEFT JOIN Examinations e ON e.student_id = s.student_id AND e.subject_name = sub.subject_name GROUP BY s.student_id, s.student_name, sub.subject_name ORDER BY s.student_id, sub.subject_name`,
    expected: [
      { student_id: 1,  student_name: "Alice", subject_name: "Math",        attended_exams: 2 },
      { student_id: 1,  student_name: "Alice", subject_name: "Physics",     attended_exams: 2 },
      { student_id: 1,  student_name: "Alice", subject_name: "Programming", attended_exams: 1 },
      { student_id: 2,  student_name: "Bob",   subject_name: "Math",        attended_exams: 0 },
      { student_id: 2,  student_name: "Bob",   subject_name: "Physics",     attended_exams: 0 },
      { student_id: 2,  student_name: "Bob",   subject_name: "Programming", attended_exams: 1 },
      { student_id: 6,  student_name: "Alex",  subject_name: "Math",        attended_exams: 0 },
      { student_id: 6,  student_name: "Alex",  subject_name: "Physics",     attended_exams: 0 },
      { student_id: 6,  student_name: "Alex",  subject_name: "Programming", attended_exams: 0 },
      { student_id: 13, student_name: "John",  subject_name: "Math",        attended_exams: 0 },
      { student_id: 13, student_name: "John",  subject_name: "Physics",     attended_exams: 0 },
      { student_id: 13, student_name: "John",  subject_name: "Programming", attended_exams: 0 },
    ],
    ordered: true,
  },
  {
    id: 570,
    title: "Managers with at Least 5 Direct Reports",
    setup: `
      CREATE TABLE Employee (id INT PRIMARY KEY, name TEXT, department TEXT, managerId INT);
      INSERT INTO Employee VALUES (101,'John','A',NULL),(102,'Dan','A',101),(103,'James','A',101),(104,'Amanda','A',101),(105,'Abe','B',101),(106,'Dip','B',NULL);
    `,
    solution: `SELECT m.name FROM Employee m JOIN Employee e ON e.managerId = m.id GROUP BY m.id, m.name HAVING COUNT(*) >= 5`,
    expected: [{ name: "John" }],
  },
  {
    id: 1934,
    title: "Confirmation Rate",
    setup: `
      CREATE TABLE Signups (user_id INT PRIMARY KEY, time_stamp TIMESTAMP);
      CREATE TABLE Confirmations (user_id INT, time_stamp TIMESTAMP, action TEXT);
      INSERT INTO Signups VALUES (3,'2020-03-21 10:16:13'),(7,'2020-01-04 13:57:59'),(2,'2020-07-29 23:09:44'),(6,'2020-12-09 10:39:37');
      INSERT INTO Confirmations VALUES (3,'2021-01-06 03:30:46','timeout'),(3,'2021-07-14 14:00:00','timeout'),(7,'2021-06-12 11:57:29','confirmed'),(7,'2021-06-13 12:58:28','confirmed'),(7,'2021-06-14 13:59:27','confirmed'),(2,'2021-01-22 00:00:00','confirmed'),(2,'2021-02-28 23:59:59','timeout');
    `,
    solution: `SELECT s.user_id, ROUND(COALESCE(AVG((c.action = 'confirmed')::int), 0), 2) AS confirmation_rate FROM Signups s LEFT JOIN Confirmations c ON s.user_id = c.user_id GROUP BY s.user_id`,
    expected: [
      { user_id: 6, confirmation_rate: "0.00" },
      { user_id: 3, confirmation_rate: "0.00" },
      { user_id: 7, confirmation_rate: "1.00" },
      { user_id: 2, confirmation_rate: "0.50" },
    ],
  },

  // ─────────────────── Category 3: Basic Aggregate Functions ───────────────────

  {
    id: 620,
    title: "Not Boring Movies",
    setup: `
      CREATE TABLE Cinema (id INT PRIMARY KEY, movie TEXT, description TEXT, rating NUMERIC);
      INSERT INTO Cinema VALUES (1,'War','great 3D',8.9),(2,'Science','boring',8.5),(3,'Irish','boring',6.2),(4,'Ice','Fantastic',9.1),(5,'House','fun',7.4);
    `,
    solution: `SELECT * FROM Cinema WHERE id % 2 = 1 AND description <> 'boring' ORDER BY rating DESC`,
    expected: [
      { id: 1, movie: "War",   description: "great 3D", rating: "8.9" },
      { id: 5, movie: "House", description: "fun",      rating: "7.4" },
    ],
    ordered: true,
  },
  {
    id: 1251,
    title: "Average Selling Price",
    setup: `
      CREATE TABLE Prices (product_id INT, start_date DATE, end_date DATE, price INT);
      CREATE TABLE UnitsSold (product_id INT, purchase_date DATE, units INT);
      INSERT INTO Prices VALUES (1,'2019-02-17','2019-02-28',5),(1,'2019-03-01','2019-03-22',20),(2,'2019-02-01','2019-02-20',15),(2,'2019-02-21','2019-03-31',30);
      INSERT INTO UnitsSold VALUES (1,'2019-02-25',100),(1,'2019-03-01',15),(2,'2019-02-10',200),(2,'2019-03-22',30);
    `,
    solution: `SELECT p.product_id, COALESCE(ROUND(SUM(p.price * u.units)::numeric / NULLIF(SUM(u.units), 0), 2), 0) AS average_price FROM Prices p LEFT JOIN UnitsSold u ON p.product_id = u.product_id AND u.purchase_date BETWEEN p.start_date AND p.end_date GROUP BY p.product_id`,
    expected: [
      { product_id: 1, average_price: "6.96" },
      { product_id: 2, average_price: "16.96" },
    ],
  },
  {
    id: 1075,
    title: "Project Employees I",
    setup: `
      CREATE TABLE Project (project_id INT, employee_id INT);
      CREATE TABLE Employee (employee_id INT PRIMARY KEY, name TEXT, experience_years INT);
      INSERT INTO Project VALUES (1,1),(1,2),(1,3),(2,1),(2,4);
      INSERT INTO Employee VALUES (1,'Khaled',3),(2,'Ali',2),(3,'John',1),(4,'Doe',2);
    `,
    solution: `SELECT p.project_id, ROUND(AVG(e.experience_years), 2) AS average_years FROM Project p JOIN Employee e ON p.employee_id = e.employee_id GROUP BY p.project_id`,
    expected: [
      { project_id: 1, average_years: "2.00" },
      { project_id: 2, average_years: "2.50" },
    ],
  },
  {
    id: 1633,
    title: "Percentage of Users Attended a Contest",
    setup: `
      CREATE TABLE Users (user_id INT PRIMARY KEY, user_name TEXT);
      CREATE TABLE Register (contest_id INT, user_id INT);
      INSERT INTO Users VALUES (6,'Alice'),(2,'Bob'),(7,'Alex');
      INSERT INTO Register VALUES (215,6),(209,2),(208,2),(210,6),(208,6),(209,7),(209,6),(215,7),(208,7),(210,2),(207,2),(210,7);
    `,
    solution: `SELECT contest_id, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Users), 2) AS percentage FROM Register GROUP BY contest_id ORDER BY percentage DESC, contest_id`,
    expected: [
      { contest_id: 208, percentage: "100.00" },
      { contest_id: 209, percentage: "100.00" },
      { contest_id: 210, percentage: "100.00" },
      { contest_id: 215, percentage: "66.67"  },
      { contest_id: 207, percentage: "33.33"  },
    ],
    ordered: true,
  },
  {
    id: 1211,
    title: "Queries Quality and Percentage",
    setup: `
      CREATE TABLE Queries (query_name TEXT, result TEXT, position INT, rating INT);
      INSERT INTO Queries VALUES ('Dog','Golden Retriever',1,5),('Dog','German Shepherd',2,5),('Dog','Mule',200,1),('Cat','Shirazi',5,2),('Cat','Siamese',3,3),('Cat','Persan',NULL,3);
    `,
    solution: `SELECT query_name, ROUND(AVG(rating::numeric / position), 2) AS quality, ROUND(100.0 * AVG((rating < 3)::int), 2) AS poor_query_percentage FROM Queries WHERE query_name IS NOT NULL GROUP BY query_name`,
    expected: [
      { query_name: "Dog", quality: "2.50", poor_query_percentage: "33.33" },
      { query_name: "Cat", quality: "0.66", poor_query_percentage: "33.33" },
    ],
  },
  {
    id: 1193,
    title: "Monthly Transactions I",
    setup: `
      CREATE TABLE Transactions (id INT PRIMARY KEY, country TEXT, state TEXT, amount INT, trans_date DATE);
      INSERT INTO Transactions VALUES (121,'US','approved',1000,'2018-12-18'),(122,'US','declined',2000,'2018-12-19'),(123,'US','approved',2000,'2019-01-01'),(124,'DE','approved',2000,'2019-01-07');
    `,
    solution: `SELECT TO_CHAR(trans_date, 'YYYY-MM') AS month, country, COUNT(*) AS trans_count, COUNT(*) FILTER (WHERE state = 'approved') AS approved_count, SUM(amount) AS trans_total_amount, COALESCE(SUM(amount) FILTER (WHERE state = 'approved'), 0) AS approved_total_amount FROM Transactions GROUP BY TO_CHAR(trans_date, 'YYYY-MM'), country`,
    expected: [
      { month: "2018-12", country: "US", trans_count: 2, approved_count: 1, trans_total_amount: 3000, approved_total_amount: 1000 },
      { month: "2019-01", country: "US", trans_count: 1, approved_count: 1, trans_total_amount: 2000, approved_total_amount: 2000 },
      { month: "2019-01", country: "DE", trans_count: 1, approved_count: 1, trans_total_amount: 2000, approved_total_amount: 2000 },
    ],
  },
  {
    id: 1174,
    title: "Immediate Food Delivery II",
    setup: `
      CREATE TABLE Delivery (delivery_id INT PRIMARY KEY, customer_id INT, order_date DATE, customer_pref_delivery_date DATE);
      INSERT INTO Delivery VALUES (1,1,'2019-08-01','2019-08-02'),(2,2,'2019-08-02','2019-08-02'),(3,1,'2019-08-11','2019-08-12'),(4,3,'2019-08-24','2019-08-24'),(5,3,'2019-08-21','2019-08-22'),(6,2,'2019-08-11','2019-08-13'),(7,4,'2019-08-09','2019-08-09');
    `,
    solution: `SELECT ROUND(100.0 * AVG((order_date = customer_pref_delivery_date)::int), 2) AS immediate_percentage FROM Delivery WHERE (customer_id, order_date) IN (SELECT customer_id, MIN(order_date) FROM Delivery GROUP BY customer_id)`,
    expected: [{ immediate_percentage: "50.00" }],
  },
  {
    id: 550,
    title: "Game Play Analysis IV",
    setup: `
      CREATE TABLE Activity (player_id INT, device_id INT, event_date DATE, games_played INT);
      INSERT INTO Activity VALUES (1,2,'2016-03-01',5),(1,2,'2016-03-02',6),(2,3,'2017-06-25',1),(3,1,'2016-03-02',0),(3,4,'2018-07-03',5);
    `,
    solution: `SELECT ROUND(COUNT(a.player_id)::numeric / (SELECT COUNT(DISTINCT player_id) FROM Activity), 2) AS fraction FROM Activity a JOIN (SELECT player_id, MIN(event_date) AS first_login FROM Activity GROUP BY player_id) f ON a.player_id = f.player_id AND a.event_date = f.first_login + 1`,
    expected: [{ fraction: "0.33" }],
  },

  // ─────────────────── Category 4: Sorting and Grouping ───────────────────────

  {
    id: 2356,
    title: "Number of Unique Subjects Taught by Each Teacher",
    setup: `
      CREATE TABLE Teacher (teacher_id INT, subject_id INT, dept_id INT);
      INSERT INTO Teacher VALUES (1,2,3),(1,2,4),(1,3,3),(2,1,1),(2,2,1),(2,3,1),(2,4,1);
    `,
    solution: `SELECT teacher_id, COUNT(DISTINCT subject_id) AS cnt FROM Teacher GROUP BY teacher_id`,
    expected: [
      { teacher_id: 1, cnt: 2 },
      { teacher_id: 2, cnt: 4 },
    ],
  },
  {
    id: 1141,
    title: "User Activity for the Past 30 Days I",
    setup: `
      CREATE TABLE Activity (user_id INT, session_id INT, activity_date DATE, activity_type TEXT);
      INSERT INTO Activity VALUES (1,1,'2019-07-20','open_session'),(1,1,'2019-07-20','scroll_down'),(1,1,'2019-07-20','end_session'),(2,4,'2019-07-20','open_session'),(2,4,'2019-07-21','send_message'),(2,4,'2019-07-21','end_session'),(3,2,'2019-07-21','open_session'),(3,2,'2019-07-21','send_message'),(3,2,'2019-07-21','end_session'),(4,3,'2019-06-25','open_session'),(4,3,'2019-06-25','end_session');
    `,
    solution: `SELECT activity_date AS day, COUNT(DISTINCT user_id) AS active_users FROM Activity WHERE activity_date BETWEEN DATE '2019-06-28' AND DATE '2019-07-27' GROUP BY activity_date`,
    expected: [
      { day: "2019-07-20", active_users: 2 },
      { day: "2019-07-21", active_users: 3 },
    ],
  },
  {
    id: 1070,
    title: "Product Sales Analysis III",
    setup: `
      CREATE TABLE Sales (sale_id INT, product_id INT, year INT, quantity INT, price INT);
      INSERT INTO Sales VALUES (1,100,2008,10,5000),(2,100,2009,12,5000),(7,200,2011,15,9000);
    `,
    solution: `SELECT product_id, year AS first_year, quantity, price FROM Sales WHERE (product_id, year) IN (SELECT product_id, MIN(year) FROM Sales GROUP BY product_id)`,
    expected: [
      { product_id: 100, first_year: 2008, quantity: 10, price: 5000 },
      { product_id: 200, first_year: 2011, quantity: 15, price: 9000 },
    ],
  },
  {
    id: 596,
    title: "Classes More Than 5 Students",
    setup: `
      CREATE TABLE Courses (student TEXT, class TEXT);
      INSERT INTO Courses VALUES ('A','Math'),('B','English'),('C','Math'),('D','Biology'),('E','Math'),('F','Computer'),('G','Math'),('H','Math'),('I','Math');
    `,
    solution: `SELECT class FROM Courses GROUP BY class HAVING COUNT(student) >= 5`,
    expected: [{ class: "Math" }],
  },
  {
    id: 1729,
    title: "Find Followers Count",
    setup: `
      CREATE TABLE Followers (user_id INT, follower_id INT);
      INSERT INTO Followers VALUES (0,1),(1,0),(2,0),(2,1);
    `,
    solution: `SELECT user_id, COUNT(follower_id) AS followers_count FROM Followers GROUP BY user_id ORDER BY user_id`,
    expected: [
      { user_id: 0, followers_count: 1 },
      { user_id: 1, followers_count: 1 },
      { user_id: 2, followers_count: 2 },
    ],
    ordered: true,
  },
  {
    id: 619,
    title: "Biggest Single Number",
    setup: `
      CREATE TABLE MyNumbers (num INT);
      INSERT INTO MyNumbers VALUES (8),(8),(3),(3),(1),(4),(5),(6);
    `,
    solution: `SELECT MAX(num) AS num FROM (SELECT num FROM MyNumbers GROUP BY num HAVING COUNT(*) = 1) singles`,
    expected: [{ num: 6 }],
  },
  {
    id: 1045,
    title: "Customers Who Bought All Products",
    setup: `
      CREATE TABLE Customer (customer_id INT, product_key INT);
      CREATE TABLE Product (product_key INT PRIMARY KEY);
      INSERT INTO Customer VALUES (1,5),(2,6),(3,5),(3,6),(1,6);
      INSERT INTO Product VALUES (5),(6);
    `,
    solution: `SELECT customer_id FROM Customer GROUP BY customer_id HAVING COUNT(DISTINCT product_key) = (SELECT COUNT(*) FROM Product)`,
    expected: [{ customer_id: 1 }, { customer_id: 3 }],
  },

  // ─────────────────── Category 5: Advanced Select and Joins ──────────────────

  {
    id: 1731,
    title: "The Number of Employees Which Report to Each Employee",
    setup: `
      CREATE TABLE Employees (employee_id INT PRIMARY KEY, name TEXT, reports_to INT, age INT);
      INSERT INTO Employees VALUES (9,'Hercy',NULL,43),(6,'Alice',9,41),(4,'Bob',9,36),(2,'Winston',NULL,37);
    `,
    solution: `SELECT m.employee_id, m.name, COUNT(*) AS reports_count, ROUND(AVG(e.age)) AS average_age FROM Employees e JOIN Employees m ON e.reports_to = m.employee_id GROUP BY m.employee_id, m.name ORDER BY m.employee_id`,
    expected: [
      { employee_id: 9, name: "Hercy", reports_count: 2, average_age: 39 },
    ],
    ordered: true,
  },
  {
    id: 1789,
    title: "Primary Department for Each Employee",
    setup: `
      CREATE TABLE Employee (employee_id INT, department_id INT, primary_flag CHAR(1));
      INSERT INTO Employee VALUES (1,1,'N'),(2,1,'Y'),(2,2,'N'),(3,3,'N'),(4,2,'N'),(4,3,'Y'),(4,6,'N');
    `,
    solution: `SELECT employee_id, department_id FROM Employee WHERE primary_flag = 'Y' OR employee_id IN (SELECT employee_id FROM Employee GROUP BY employee_id HAVING COUNT(*) = 1)`,
    expected: [
      { employee_id: 1, department_id: 1 },
      { employee_id: 2, department_id: 1 },
      { employee_id: 3, department_id: 3 },
      { employee_id: 4, department_id: 3 },
    ],
  },
  {
    id: 610,
    title: "Triangle Judgement",
    setup: `
      CREATE TABLE Triangle (x INT, y INT, z INT);
      INSERT INTO Triangle VALUES (13,15,30),(10,20,15);
    `,
    solution: `SELECT x, y, z, CASE WHEN x + y > z AND x + z > y AND y + z > x THEN 'Yes' ELSE 'No' END AS triangle FROM Triangle`,
    expected: [
      { x: 13, y: 15, z: 30, triangle: "No"  },
      { x: 10, y: 20, z: 15, triangle: "Yes" },
    ],
  },
  {
    id: 180,
    title: "Consecutive Numbers",
    setup: `
      CREATE TABLE Logs (id INT PRIMARY KEY, num INT);
      INSERT INTO Logs VALUES (1,1),(2,1),(3,1),(4,2),(5,1),(6,2),(7,2);
    `,
    solution: `SELECT DISTINCT l1.num AS "ConsecutiveNums" FROM Logs l1 JOIN Logs l2 ON l2.id = l1.id + 1 AND l2.num = l1.num JOIN Logs l3 ON l3.id = l1.id + 2 AND l3.num = l1.num`,
    expected: [{ ConsecutiveNums: 1 }],
  },
  {
    id: 1164,
    title: "Product Price at a Given Date",
    setup: `
      CREATE TABLE Products (product_id INT, new_price INT, change_date DATE);
      INSERT INTO Products VALUES (1,20,'2019-08-14'),(2,50,'2019-08-14'),(1,30,'2019-08-15'),(1,35,'2019-08-16'),(2,65,'2019-08-17'),(3,20,'2019-08-18');
    `,
    solution: `SELECT p.product_id, COALESCE(l.new_price, 10) AS price FROM (SELECT DISTINCT product_id FROM Products) p LEFT JOIN (SELECT DISTINCT ON (product_id) product_id, new_price FROM Products WHERE change_date <= DATE '2019-08-16' ORDER BY product_id, change_date DESC) l ON p.product_id = l.product_id`,
    expected: [
      { product_id: 2, price: 50 },
      { product_id: 1, price: 35 },
      { product_id: 3, price: 10 },
    ],
  },
  {
    id: 1204,
    title: "Last Person to Fit in the Bus",
    setup: `
      CREATE TABLE Queue (person_id INT PRIMARY KEY, person_name TEXT, weight INT, turn INT);
      INSERT INTO Queue VALUES (5,'Alice',250,1),(4,'Bob',175,5),(3,'Alex',350,2),(6,'John Cena',400,3),(1,'Winston',500,6),(2,'Marie',200,4);
    `,
    solution: `SELECT person_name FROM (SELECT person_name, SUM(weight) OVER (ORDER BY turn) AS total_weight FROM Queue) t WHERE total_weight <= 1000 ORDER BY total_weight DESC LIMIT 1`,
    expected: [{ person_name: "John Cena" }],
  },
  {
    id: 1907,
    title: "Count Salary Categories",
    setup: `
      CREATE TABLE Accounts (account_id INT PRIMARY KEY, income INT);
      INSERT INTO Accounts VALUES (3,108939),(2,12747),(8,87709),(6,91796);
    `,
    solution: `SELECT 'Low Salary' AS category, COUNT(*) FILTER (WHERE income < 20000) AS accounts_count FROM Accounts UNION ALL SELECT 'Average Salary', COUNT(*) FILTER (WHERE income BETWEEN 20000 AND 50000) FROM Accounts UNION ALL SELECT 'High Salary', COUNT(*) FILTER (WHERE income > 50000) FROM Accounts`,
    expected: [
      { category: "Low Salary",     accounts_count: 1 },
      { category: "Average Salary", accounts_count: 0 },
      { category: "High Salary",    accounts_count: 3 },
    ],
    ordered: true,
  },

  // ───────────────────────── Category 6: Subqueries ───────────────────────────

  {
    id: 1978,
    title: "Employees Whose Manager Left the Company",
    setup: `
      CREATE TABLE Employees (employee_id INT PRIMARY KEY, name TEXT, manager_id INT, salary INT);
      INSERT INTO Employees VALUES (3,'Mila',9,60651),(12,'Annyk',9,55008),(13,'Khali',11,45555),(1,'Kalel',11,21241),(9,'Micha',6,20302),(11,'Jozua',6,20077);
    `,
    solution: `SELECT employee_id FROM Employees WHERE salary < 30000 AND manager_id IS NOT NULL AND manager_id NOT IN (SELECT employee_id FROM Employees) ORDER BY employee_id`,
    expected: [{ employee_id: 11 }, { employee_id: 1 }],
    ordered: true,
  },
  {
    id: 626,
    title: "Exchange Seats",
    setup: `
      CREATE TABLE Seat (id INT PRIMARY KEY, student TEXT);
      INSERT INTO Seat VALUES (1,'Abbot'),(2,'Doris'),(3,'Emerson'),(4,'Green'),(5,'Jeames');
    `,
    solution: `SELECT CASE WHEN id % 2 = 1 AND id = (SELECT MAX(id) FROM Seat) THEN id WHEN id % 2 = 1 THEN id + 1 ELSE id - 1 END AS id, student FROM Seat ORDER BY id`,
    expected: [
      { id: 1, student: "Doris"   },
      { id: 2, student: "Abbot"   },
      { id: 3, student: "Green"   },
      { id: 4, student: "Emerson" },
      { id: 5, student: "Jeames"  },
    ],
    ordered: true,
  },
  {
    id: 1341,
    title: "Movie Rating",
    setup: `
      CREATE TABLE Movies (movie_id INT PRIMARY KEY, title TEXT);
      CREATE TABLE Users (user_id INT PRIMARY KEY, name TEXT);
      CREATE TABLE MovieRating (movie_id INT, user_id INT, rating INT, created_at DATE);
      INSERT INTO Movies VALUES (1,'Avengers'),(2,'Frozen 2'),(3,'Joker');
      INSERT INTO Users VALUES (1,'Daniel'),(2,'Monica'),(3,'Maria'),(4,'James');
      INSERT INTO MovieRating VALUES (1,1,3,'2020-01-12'),(1,2,4,'2020-02-11'),(1,3,2,'2020-02-12'),(1,4,1,'2020-01-01'),(2,1,5,'2020-02-17'),(2,2,2,'2020-02-01'),(2,3,2,'2020-03-01'),(3,1,3,'2020-02-22'),(3,2,4,'2020-02-25');
    `,
    solution: `(SELECT u.name AS results FROM MovieRating r JOIN Users u ON r.user_id = u.user_id GROUP BY u.user_id, u.name ORDER BY COUNT(*) DESC, u.name LIMIT 1) UNION ALL (SELECT m.title FROM MovieRating r JOIN Movies m ON r.movie_id = m.movie_id WHERE r.created_at >= DATE '2020-02-01' AND r.created_at < DATE '2020-03-01' GROUP BY m.movie_id, m.title ORDER BY AVG(r.rating) DESC, m.title LIMIT 1)`,
    expected: [{ results: "Daniel" }, { results: "Frozen 2" }],
    ordered: true,
  },
  {
    id: 1321,
    title: "Restaurant Growth",
    setup: `
      CREATE TABLE Customer (customer_id INT, name TEXT, visited_on DATE, amount INT);
      INSERT INTO Customer VALUES (1,'Jhon','2019-01-01',100),(2,'Daniel','2019-01-02',110),(3,'Jade','2019-01-03',120),(4,'Khaled','2019-01-04',130),(5,'Winston','2019-01-05',110),(6,'Elvis','2019-01-06',140),(7,'Anna','2019-01-07',150),(8,'Maria','2019-01-08',80),(9,'Jaze','2019-01-09',110),(1,'Jhon','2019-01-10',130),(3,'Jade','2019-01-10',150);
    `,
    solution: `WITH daily AS (SELECT visited_on, SUM(amount) AS amount FROM Customer GROUP BY visited_on) SELECT visited_on, amount, average_amount FROM (SELECT visited_on, SUM(amount) OVER w AS amount, ROUND(AVG(amount) OVER w, 2) AS average_amount FROM daily WINDOW w AS (ORDER BY visited_on RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW)) t WHERE visited_on >= (SELECT MIN(visited_on) FROM daily) + 6 ORDER BY visited_on`,
    expected: [
      { visited_on: "2019-01-07", amount: 860,  average_amount: "122.86" },
      { visited_on: "2019-01-08", amount: 840,  average_amount: "120.00" },
      { visited_on: "2019-01-09", amount: 840,  average_amount: "120.00" },
      { visited_on: "2019-01-10", amount: 1000, average_amount: "142.86" },
    ],
    ordered: true,
  },
  {
    id: 602,
    title: "Friend Requests II: Who Has the Most Friends",
    setup: `
      CREATE TABLE RequestAccepted (requester_id INT, accepter_id INT, accept_date DATE);
      INSERT INTO RequestAccepted VALUES (1,2,'2016-06-03'),(1,3,'2016-06-08'),(2,3,'2016-06-08'),(3,4,'2016-06-09');
    `,
    solution: `SELECT id, COUNT(*) AS num FROM (SELECT requester_id AS id FROM RequestAccepted UNION ALL SELECT accepter_id FROM RequestAccepted) t GROUP BY id ORDER BY num DESC LIMIT 1`,
    expected: [{ id: 3, num: 3 }],
  },
  {
    id: 585,
    title: "Investments in 2016",
    setup: `
      CREATE TABLE Insurance (pid INT PRIMARY KEY, tiv_2015 NUMERIC, tiv_2016 NUMERIC, lat NUMERIC, lon NUMERIC);
      INSERT INTO Insurance VALUES (1,10,5,10,10),(2,20,20,20,20),(3,10,30,20,20),(4,10,40,40,40);
    `,
    solution: `SELECT ROUND(SUM(tiv_2016)::numeric, 2) AS tiv_2016 FROM (SELECT tiv_2016, COUNT(*) OVER (PARTITION BY tiv_2015) AS same_2015, COUNT(*) OVER (PARTITION BY lat, lon) AS same_location FROM Insurance) t WHERE same_2015 > 1 AND same_location = 1`,
    expected: [{ tiv_2016: "45.00" }],
  },
  {
    id: 185,
    title: "Department Top Three Salaries",
    setup: `
      CREATE TABLE Employee (id INT PRIMARY KEY, name TEXT, salary INT, departmentId INT);
      CREATE TABLE Department (id INT PRIMARY KEY, name TEXT);
      INSERT INTO Employee VALUES (1,'Joe',85000,1),(2,'Henry',80000,2),(3,'Sam',60000,2),(4,'Max',90000,1),(5,'Janet',69000,1),(6,'Randy',85000,1),(7,'Will',70000,1);
      INSERT INTO Department VALUES (1,'IT'),(2,'Sales');
    `,
    solution: `SELECT d.name AS "Department", e.name AS "Employee", e.salary AS "Salary" FROM (SELECT name, salary, departmentId, DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rnk FROM Employee) e JOIN Department d ON e.departmentId = d.id WHERE e.rnk <= 3`,
    expected: [
      { Department: "IT",    Employee: "Max",   Salary: 90000 },
      { Department: "IT",    Employee: "Joe",   Salary: 85000 },
      { Department: "IT",    Employee: "Randy", Salary: 85000 },
      { Department: "IT",    Employee: "Will",  Salary: 70000 },
      { Department: "Sales", Employee: "Henry", Salary: 80000 },
      { Department: "Sales", Employee: "Sam",   Salary: 60000 },
    ],
  },

  // ────────── Category 7: Advanced String Functions / Regex / Clause ───────────

  {
    id: 1667,
    title: "Fix Names in a Table",
    setup: `
      CREATE TABLE Users (user_id INT PRIMARY KEY, name TEXT);
      INSERT INTO Users VALUES (1,'aLice'),(2,'bOB');
    `,
    solution: `SELECT user_id, UPPER(LEFT(name, 1)) || LOWER(SUBSTRING(name FROM 2)) AS name FROM Users ORDER BY user_id`,
    expected: [
      { user_id: 1, name: "Alice" },
      { user_id: 2, name: "Bob"   },
    ],
    ordered: true,
  },
  {
    id: 1527,
    title: "Patients With a Condition",
    setup: `
      CREATE TABLE Patients (patient_id INT PRIMARY KEY, patient_name TEXT, conditions TEXT);
      INSERT INTO Patients VALUES (1,'Daniel','YFEV COUGH'),(2,'Alice',''),(3,'Bob','DIAB100 MYOP'),(4,'George','ACNE DIAB100'),(5,'Alain','DIAB201');
    `,
    solution: `SELECT patient_id, patient_name, conditions FROM Patients WHERE conditions LIKE 'DIAB1%' OR conditions LIKE '% DIAB1%'`,
    expected: [
      { patient_id: 3, patient_name: "Bob",    conditions: "DIAB100 MYOP" },
      { patient_id: 4, patient_name: "George", conditions: "ACNE DIAB100" },
    ],
  },
  {
    id: 196,
    title: "Delete Duplicate Emails",
    setup: `
      CREATE TABLE Person (id INT PRIMARY KEY, email TEXT);
      INSERT INTO Person VALUES (1,'john@example.com'),(2,'bob@example.com'),(3,'john@example.com');
    `,
    solution: `DELETE FROM Person p USING Person q WHERE p.email = q.email AND p.id > q.id; SELECT * FROM Person ORDER BY id`,
    expected: [
      { id: 1, email: "john@example.com" },
      { id: 2, email: "bob@example.com"  },
    ],
    ordered: true,
  },
  {
    id: 176,
    title: "Second Highest Salary",
    setup: `
      CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);
      INSERT INTO Employee VALUES (1,100),(2,200),(3,300);
    `,
    solution: `SELECT (SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1) AS "SecondHighestSalary"`,
    expected: [{ SecondHighestSalary: 200 }],
  },
  {
    id: 1484,
    title: "Group Sold Products By The Date",
    setup: `
      CREATE TABLE Activities (sell_date DATE, product TEXT);
      INSERT INTO Activities VALUES ('2020-05-30','Headphone'),('2020-06-01','Pencil'),('2020-06-02','Mask'),('2020-05-30','Basketball'),('2020-06-01','Bible'),('2020-06-02','Mask'),('2020-05-30','T-Shirt');
    `,
    solution: `SELECT sell_date, COUNT(DISTINCT product) AS num_sold, STRING_AGG(DISTINCT product, ',' ORDER BY product) AS products FROM Activities GROUP BY sell_date ORDER BY sell_date`,
    expected: [
      { sell_date: "2020-05-30", num_sold: 3, products: "Basketball,Headphone,T-Shirt" },
      { sell_date: "2020-06-01", num_sold: 2, products: "Bible,Pencil"                 },
      { sell_date: "2020-06-02", num_sold: 1, products: "Mask"                         },
    ],
    ordered: true,
  },
  {
    id: 1327,
    title: "List the Products Ordered in a Period",
    setup: `
      CREATE TABLE Products (product_id INT PRIMARY KEY, product_name TEXT, product_category TEXT);
      CREATE TABLE Orders (product_id INT, order_date DATE, unit INT);
      INSERT INTO Products VALUES (1,'Leetcode Solutions','Book'),(2,'Jewels of Stringology','Book'),(3,'HP','Laptop'),(4,'Lenovo','Laptop'),(5,'Leetcode Kit','T-shirt');
      INSERT INTO Orders VALUES (1,'2020-02-05',60),(1,'2020-02-10',70),(2,'2020-01-18',30),(2,'2020-02-11',80),(3,'2020-02-17',2),(3,'2020-02-24',3),(4,'2020-03-01',20),(4,'2020-03-04',30),(4,'2020-03-04',60),(5,'2020-02-25',50),(5,'2020-02-27',50),(5,'2020-03-01',50);
    `,
    solution: `SELECT p.product_name, SUM(o.unit) AS unit FROM Products p JOIN Orders o ON p.product_id = o.product_id WHERE o.order_date >= DATE '2020-02-01' AND o.order_date < DATE '2020-03-01' GROUP BY p.product_id, p.product_name HAVING SUM(o.unit) >= 100`,
    expected: [
      { product_name: "Leetcode Solutions", unit: 130 },
      { product_name: "Leetcode Kit",       unit: 100 },
    ],
  },
  {
    id: 1517,
    title: "Find Users With Valid E-Mails",
    setup: `
      CREATE TABLE Users (user_id INT PRIMARY KEY, name TEXT, mail TEXT);
      INSERT INTO Users VALUES (1,'Winston','winston@leetcode.com'),(2,'Jonathan','jonathanisgreat'),(3,'Annabelle','bella-@leetcode.com'),(4,'Sally','sally.come@leetcode.com'),(5,'Marwan','-omar@leetcode.com'),(6,'David','david69@leetcode.com'),(7,'Shapiro','.shapo@leetcode.com');
    `,
    solution: `SELECT * FROM Users WHERE mail ~ '^[A-Za-z][A-Za-z0-9_.-]*@leetcode\\.com$'`,
    expected: [
      { user_id: 1, name: "Winston",  mail: "winston@leetcode.com"    },
      { user_id: 3, name: "Annabelle",mail: "bella-@leetcode.com"     },
      { user_id: 4, name: "Sally",    mail: "sally.come@leetcode.com" },
      { user_id: 6, name: "David",    mail: "david69@leetcode.com"    },
    ],
  },
];
