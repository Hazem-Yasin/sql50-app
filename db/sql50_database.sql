-- LeetCode SQL 50 study plan: problems and PostgreSQL solutions
--
-- Step 0 (only if the database doesn't exist yet).
-- Run this on its own while connected to the default "postgres" database,
-- then switch the console to the new database:
--   CREATE DATABASE sql50;
--
-- Source of the problem list: LeetCode "SQL 50" study plan (50 problems, 7 groups).
-- The solutions are written for PostgreSQL and are my own; check them on LeetCode.

-- ============================================================
-- Step 1: tables
-- ============================================================
DROP TABLE IF EXISTS solutions;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name     VARCHAR(100) NOT NULL UNIQUE,
    position INT NOT NULL UNIQUE
);

CREATE TABLE problems (
    leetcode_id INT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    slug        VARCHAR(200) NOT NULL UNIQUE,
    difficulty  VARCHAR(6) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    category_id INT NOT NULL REFERENCES categories (id),
    position    INT NOT NULL UNIQUE   -- order inside the study plan, 1 to 50
);

CREATE TABLE solutions (
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    problem_id INT NOT NULL REFERENCES problems (leetcode_id),
    dialect    VARCHAR(20) NOT NULL CHECK (dialect IN ('postgresql', 'mysql', 'sqlserver')),
    sql_text   TEXT NOT NULL,
    UNIQUE (problem_id, dialect)
);

CREATE INDEX idx_problems_category_id ON problems (category_id);

-- ============================================================
-- Step 2: the 7 groups of the study plan
-- ============================================================
INSERT INTO categories (name, position) VALUES
    ('Select', 1),
    ('Basic Joins', 2),
    ('Basic Aggregate Functions', 3),
    ('Sorting and Grouping', 4),
    ('Advanced Select and Joins', 5),
    ('Subqueries', 6),
    ('Advanced String Functions / Regex / Clause', 7);

-- ============================================================
-- Step 3: the 50 problems
-- ============================================================
INSERT INTO problems (leetcode_id, title, slug, difficulty, category_id, position)
SELECT v.leetcode_id, v.title, v.slug, v.difficulty, c.id, v.position
FROM (VALUES
    (1757, 'Recyclable and Low Fat Products', 'recyclable-and-low-fat-products', 'EASY', 'Select', 1),
    (584,  'Find Customer Referee', 'find-customer-referee', 'EASY', 'Select', 2),
    (595,  'Big Countries', 'big-countries', 'EASY', 'Select', 3),
    (1148, 'Article Views I', 'article-views-i', 'EASY', 'Select', 4),
    (1683, 'Invalid Tweets', 'invalid-tweets', 'EASY', 'Select', 5),

    (1378, 'Replace Employee ID With The Unique Identifier', 'replace-employee-id-with-the-unique-identifier', 'EASY', 'Basic Joins', 6),
    (1068, 'Product Sales Analysis I', 'product-sales-analysis-i', 'EASY', 'Basic Joins', 7),
    (1581, 'Customer Who Visited but Did Not Make Any Transactions', 'customer-who-visited-but-did-not-make-any-transactions', 'EASY', 'Basic Joins', 8),
    (197,  'Rising Temperature', 'rising-temperature', 'EASY', 'Basic Joins', 9),
    (1661, 'Average Time of Process per Machine', 'average-time-of-process-per-machine', 'EASY', 'Basic Joins', 10),
    (577,  'Employee Bonus', 'employee-bonus', 'EASY', 'Basic Joins', 11),
    (1280, 'Students and Examinations', 'students-and-examinations', 'EASY', 'Basic Joins', 12),
    (570,  'Managers with at Least 5 Direct Reports', 'managers-with-at-least-5-direct-reports', 'MEDIUM', 'Basic Joins', 13),
    (1934, 'Confirmation Rate', 'confirmation-rate', 'MEDIUM', 'Basic Joins', 14),

    (620,  'Not Boring Movies', 'not-boring-movies', 'EASY', 'Basic Aggregate Functions', 15),
    (1251, 'Average Selling Price', 'average-selling-price', 'EASY', 'Basic Aggregate Functions', 16),
    (1075, 'Project Employees I', 'project-employees-i', 'EASY', 'Basic Aggregate Functions', 17),
    (1633, 'Percentage of Users Attended a Contest', 'percentage-of-users-attended-a-contest', 'EASY', 'Basic Aggregate Functions', 18),
    (1211, 'Queries Quality and Percentage', 'queries-quality-and-percentage', 'EASY', 'Basic Aggregate Functions', 19),
    (1193, 'Monthly Transactions I', 'monthly-transactions-i', 'MEDIUM', 'Basic Aggregate Functions', 20),
    (1174, 'Immediate Food Delivery II', 'immediate-food-delivery-ii', 'MEDIUM', 'Basic Aggregate Functions', 21),
    (550,  'Game Play Analysis IV', 'game-play-analysis-iv', 'MEDIUM', 'Basic Aggregate Functions', 22),

    (2356, 'Number of Unique Subjects Taught by Each Teacher', 'number-of-unique-subjects-taught-by-each-teacher', 'EASY', 'Sorting and Grouping', 23),
    (1141, 'User Activity for the Past 30 Days I', 'user-activity-for-the-past-30-days-i', 'EASY', 'Sorting and Grouping', 24),
    (1070, 'Product Sales Analysis III', 'product-sales-analysis-iii', 'MEDIUM', 'Sorting and Grouping', 25),
    (596,  'Classes With at Least 5 Students', 'classes-with-at-least-5-students', 'EASY', 'Sorting and Grouping', 26),
    (1729, 'Find Followers Count', 'find-followers-count', 'EASY', 'Sorting and Grouping', 27),
    (619,  'Biggest Single Number', 'biggest-single-number', 'EASY', 'Sorting and Grouping', 28),
    (1045, 'Customers Who Bought All Products', 'customers-who-bought-all-products', 'MEDIUM', 'Sorting and Grouping', 29),

    (1731, 'The Number of Employees Which Report to Each Employee', 'the-number-of-employees-which-report-to-each-employee', 'EASY', 'Advanced Select and Joins', 30),
    (1789, 'Primary Department for Each Employee', 'primary-department-for-each-employee', 'EASY', 'Advanced Select and Joins', 31),
    (610,  'Triangle Judgement', 'triangle-judgement', 'EASY', 'Advanced Select and Joins', 32),
    (180,  'Consecutive Numbers', 'consecutive-numbers', 'MEDIUM', 'Advanced Select and Joins', 33),
    (1164, 'Product Price at a Given Date', 'product-price-at-a-given-date', 'MEDIUM', 'Advanced Select and Joins', 34),
    (1204, 'Last Person to Fit in the Bus', 'last-person-to-fit-in-the-bus', 'MEDIUM', 'Advanced Select and Joins', 35),
    (1907, 'Count Salary Categories', 'count-salary-categories', 'MEDIUM', 'Advanced Select and Joins', 36),

    (1978, 'Employees Whose Manager Left the Company', 'employees-whose-manager-left-the-company', 'EASY', 'Subqueries', 37),
    (626,  'Exchange Seats', 'exchange-seats', 'MEDIUM', 'Subqueries', 38),
    (1341, 'Movie Rating', 'movie-rating', 'MEDIUM', 'Subqueries', 39),
    (1321, 'Restaurant Growth', 'restaurant-growth', 'MEDIUM', 'Subqueries', 40),
    (602,  'Friend Requests II: Who Has the Most Friends', 'friend-requests-ii-who-has-the-most-friends', 'MEDIUM', 'Subqueries', 41),
    (585,  'Investments in 2016', 'investments-in-2016', 'MEDIUM', 'Subqueries', 42),
    (185,  'Department Top Three Salaries', 'department-top-three-salaries', 'HARD', 'Subqueries', 43),

    (1667, 'Fix Names in a Table', 'fix-names-in-a-table', 'EASY', 'Advanced String Functions / Regex / Clause', 44),
    (1527, 'Patients With a Condition', 'patients-with-a-condition', 'EASY', 'Advanced String Functions / Regex / Clause', 45),
    (196,  'Delete Duplicate Emails', 'delete-duplicate-emails', 'EASY', 'Advanced String Functions / Regex / Clause', 46),
    (176,  'Second Highest Salary', 'second-highest-salary', 'MEDIUM', 'Advanced String Functions / Regex / Clause', 47),
    (1484, 'Group Sold Products By The Date', 'group-sold-products-by-the-date', 'EASY', 'Advanced String Functions / Regex / Clause', 48),
    (1327, 'List the Products Ordered in a Period', 'list-the-products-ordered-in-a-period', 'EASY', 'Advanced String Functions / Regex / Clause', 49),
    (1517, 'Find Users With Valid E-Mails', 'find-users-with-valid-e-mails', 'EASY', 'Advanced String Functions / Regex / Clause', 50)
) AS v (leetcode_id, title, slug, difficulty, category, position)
JOIN categories c ON c.name = v.category;

-- ============================================================
-- Step 4: PostgreSQL solutions (dollar quoting keeps the SQL text unchanged)
-- ============================================================
INSERT INTO solutions (problem_id, dialect, sql_text) VALUES

(1757, 'postgresql', $sql$
SELECT product_id
FROM Products
WHERE low_fats = 'Y' AND recyclable = 'Y';
$sql$),

(584, 'postgresql', $sql$
SELECT name
FROM Customer
WHERE referee_id IS DISTINCT FROM 2;
$sql$),

(595, 'postgresql', $sql$
SELECT name, population, area
FROM World
WHERE area >= 3000000 OR population >= 25000000;
$sql$),

(1148, 'postgresql', $sql$
SELECT DISTINCT author_id AS id
FROM Views
WHERE author_id = viewer_id
ORDER BY id;
$sql$),

(1683, 'postgresql', $sql$
SELECT tweet_id
FROM Tweets
WHERE LENGTH(content) > 15;
$sql$),

(1378, 'postgresql', $sql$
SELECT eu.unique_id, e.name
FROM Employees e
LEFT JOIN EmployeeUNI eu ON e.id = eu.id;
$sql$),

(1068, 'postgresql', $sql$
SELECT p.product_name, s.year, s.price
FROM Sales s
JOIN Product p ON s.product_id = p.product_id;
$sql$),

(1581, 'postgresql', $sql$
SELECT v.customer_id, COUNT(*) AS count_no_trans
FROM Visits v
LEFT JOIN Transactions t ON v.visit_id = t.visit_id
WHERE t.transaction_id IS NULL
GROUP BY v.customer_id;
$sql$),

(197, 'postgresql', $sql$
SELECT today.id
FROM Weather today
JOIN Weather yesterday ON today.recordDate = yesterday.recordDate + 1
WHERE today.temperature > yesterday.temperature;
$sql$),

(1661, 'postgresql', $sql$
SELECT s.machine_id,
       ROUND(AVG(e.timestamp - s.timestamp), 3) AS processing_time
FROM Activity s
JOIN Activity e
  ON s.machine_id = e.machine_id
 AND s.process_id = e.process_id
WHERE s.activity_type = 'start'
  AND e.activity_type = 'end'
GROUP BY s.machine_id;
$sql$),

(577, 'postgresql', $sql$
SELECT e.name, b.bonus
FROM Employee e
LEFT JOIN Bonus b ON e.empId = b.empId
WHERE b.bonus < 1000 OR b.bonus IS NULL;
$sql$),

(1280, 'postgresql', $sql$
SELECT s.student_id, s.student_name, sub.subject_name,
       COUNT(e.subject_name) AS attended_exams
FROM Students s
CROSS JOIN Subjects sub
LEFT JOIN Examinations e
       ON e.student_id = s.student_id
      AND e.subject_name = sub.subject_name
GROUP BY s.student_id, s.student_name, sub.subject_name
ORDER BY s.student_id, sub.subject_name;
$sql$),

(570, 'postgresql', $sql$
SELECT m.name
FROM Employee m
JOIN Employee e ON e.managerId = m.id
GROUP BY m.id, m.name
HAVING COUNT(*) >= 5;
$sql$),

(1934, 'postgresql', $sql$
SELECT s.user_id,
       ROUND(COALESCE(AVG((c.action = 'confirmed')::int), 0), 2) AS confirmation_rate
FROM Signups s
LEFT JOIN Confirmations c ON s.user_id = c.user_id
GROUP BY s.user_id;
$sql$),

(620, 'postgresql', $sql$
SELECT *
FROM Cinema
WHERE id % 2 = 1 AND description <> 'boring'
ORDER BY rating DESC;
$sql$),

(1251, 'postgresql', $sql$
SELECT p.product_id,
       COALESCE(ROUND(SUM(p.price * u.units)::numeric / NULLIF(SUM(u.units), 0), 2), 0) AS average_price
FROM Prices p
LEFT JOIN UnitsSold u
       ON p.product_id = u.product_id
      AND u.purchase_date BETWEEN p.start_date AND p.end_date
GROUP BY p.product_id;
$sql$),

(1075, 'postgresql', $sql$
SELECT p.project_id, ROUND(AVG(e.experience_years), 2) AS average_years
FROM Project p
JOIN Employee e ON p.employee_id = e.employee_id
GROUP BY p.project_id;
$sql$),

(1633, 'postgresql', $sql$
SELECT contest_id,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Users), 2) AS percentage
FROM Register
GROUP BY contest_id
ORDER BY percentage DESC, contest_id;
$sql$),

(1211, 'postgresql', $sql$
SELECT query_name,
       ROUND(AVG(rating::numeric / position), 2) AS quality,
       ROUND(100.0 * AVG((rating < 3)::int), 2) AS poor_query_percentage
FROM Queries
WHERE query_name IS NOT NULL
GROUP BY query_name;
$sql$),

(1193, 'postgresql', $sql$
SELECT TO_CHAR(trans_date, 'YYYY-MM') AS month,
       country,
       COUNT(*) AS trans_count,
       COUNT(*) FILTER (WHERE state = 'approved') AS approved_count,
       SUM(amount) AS trans_total_amount,
       COALESCE(SUM(amount) FILTER (WHERE state = 'approved'), 0) AS approved_total_amount
FROM Transactions
GROUP BY TO_CHAR(trans_date, 'YYYY-MM'), country;
$sql$),

(1174, 'postgresql', $sql$
SELECT ROUND(100.0 * AVG((order_date = customer_pref_delivery_date)::int), 2) AS immediate_percentage
FROM Delivery
WHERE (customer_id, order_date) IN (
    SELECT customer_id, MIN(order_date)
    FROM Delivery
    GROUP BY customer_id
);
$sql$),

(550, 'postgresql', $sql$
SELECT ROUND(COUNT(a.player_id)::numeric / (SELECT COUNT(DISTINCT player_id) FROM Activity), 2) AS fraction
FROM Activity a
JOIN (
    SELECT player_id, MIN(event_date) AS first_login
    FROM Activity
    GROUP BY player_id
) f ON a.player_id = f.player_id
   AND a.event_date = f.first_login + 1;
$sql$),

(2356, 'postgresql', $sql$
SELECT teacher_id, COUNT(DISTINCT subject_id) AS cnt
FROM Teacher
GROUP BY teacher_id;
$sql$),

(1141, 'postgresql', $sql$
SELECT activity_date AS day, COUNT(DISTINCT user_id) AS active_users
FROM Activity
WHERE activity_date BETWEEN DATE '2019-06-28' AND DATE '2019-07-27'
GROUP BY activity_date;
$sql$),

(1070, 'postgresql', $sql$
SELECT product_id, year AS first_year, quantity, price
FROM Sales
WHERE (product_id, year) IN (
    SELECT product_id, MIN(year)
    FROM Sales
    GROUP BY product_id
);
$sql$),

(596, 'postgresql', $sql$
SELECT class
FROM Courses
GROUP BY class
HAVING COUNT(student) >= 5;
$sql$),

(1729, 'postgresql', $sql$
SELECT user_id, COUNT(follower_id) AS followers_count
FROM Followers
GROUP BY user_id
ORDER BY user_id;
$sql$),

(619, 'postgresql', $sql$
SELECT MAX(num) AS num
FROM (
    SELECT num
    FROM MyNumbers
    GROUP BY num
    HAVING COUNT(*) = 1
) singles;
$sql$),

(1045, 'postgresql', $sql$
SELECT customer_id
FROM Customer
GROUP BY customer_id
HAVING COUNT(DISTINCT product_key) = (SELECT COUNT(*) FROM Product);
$sql$),

(1731, 'postgresql', $sql$
SELECT m.employee_id, m.name,
       COUNT(*) AS reports_count,
       ROUND(AVG(e.age)) AS average_age
FROM Employees e
JOIN Employees m ON e.reports_to = m.employee_id
GROUP BY m.employee_id, m.name
ORDER BY m.employee_id;
$sql$),

(1789, 'postgresql', $sql$
SELECT employee_id, department_id
FROM Employee
WHERE primary_flag = 'Y'
   OR employee_id IN (
        SELECT employee_id
        FROM Employee
        GROUP BY employee_id
        HAVING COUNT(*) = 1
   );
$sql$),

(610, 'postgresql', $sql$
SELECT x, y, z,
       CASE WHEN x + y > z AND x + z > y AND y + z > x THEN 'Yes' ELSE 'No' END AS triangle
FROM Triangle;
$sql$),

(180, 'postgresql', $sql$
SELECT DISTINCT l1.num AS "ConsecutiveNums"
FROM Logs l1
JOIN Logs l2 ON l2.id = l1.id + 1 AND l2.num = l1.num
JOIN Logs l3 ON l3.id = l1.id + 2 AND l3.num = l1.num;
$sql$),

(1164, 'postgresql', $sql$
SELECT p.product_id, COALESCE(l.new_price, 10) AS price
FROM (SELECT DISTINCT product_id FROM Products) p
LEFT JOIN (
    SELECT DISTINCT ON (product_id) product_id, new_price
    FROM Products
    WHERE change_date <= DATE '2019-08-16'
    ORDER BY product_id, change_date DESC
) l ON p.product_id = l.product_id;
$sql$),

(1204, 'postgresql', $sql$
SELECT person_name
FROM (
    SELECT person_name, SUM(weight) OVER (ORDER BY turn) AS total_weight
    FROM Queue
) t
WHERE total_weight <= 1000
ORDER BY total_weight DESC
LIMIT 1;
$sql$),

(1907, 'postgresql', $sql$
SELECT 'Low Salary' AS category,
       COUNT(*) FILTER (WHERE income < 20000) AS accounts_count
FROM Accounts
UNION ALL
SELECT 'Average Salary',
       COUNT(*) FILTER (WHERE income BETWEEN 20000 AND 50000)
FROM Accounts
UNION ALL
SELECT 'High Salary',
       COUNT(*) FILTER (WHERE income > 50000)
FROM Accounts;
$sql$),

(1978, 'postgresql', $sql$
SELECT employee_id
FROM Employees
WHERE salary < 30000
  AND manager_id IS NOT NULL
  AND manager_id NOT IN (SELECT employee_id FROM Employees)
ORDER BY employee_id;
$sql$),

(626, 'postgresql', $sql$
SELECT CASE
           WHEN id % 2 = 1 AND id = (SELECT MAX(id) FROM Seat) THEN id
           WHEN id % 2 = 1 THEN id + 1
           ELSE id - 1
       END AS id,
       student
FROM Seat
ORDER BY id;
$sql$),

(1341, 'postgresql', $sql$
(SELECT u.name AS results
 FROM MovieRating r
 JOIN Users u ON r.user_id = u.user_id
 GROUP BY u.user_id, u.name
 ORDER BY COUNT(*) DESC, u.name
 LIMIT 1)
UNION ALL
(SELECT m.title
 FROM MovieRating r
 JOIN Movies m ON r.movie_id = m.movie_id
 WHERE r.created_at >= DATE '2020-02-01' AND r.created_at < DATE '2020-03-01'
 GROUP BY m.movie_id, m.title
 ORDER BY AVG(r.rating) DESC, m.title
 LIMIT 1);
$sql$),

(1321, 'postgresql', $sql$
WITH daily AS (
    SELECT visited_on, SUM(amount) AS amount
    FROM Customer
    GROUP BY visited_on
)
SELECT visited_on, amount, average_amount
FROM (
    SELECT visited_on,
           SUM(amount) OVER w AS amount,
           ROUND(AVG(amount) OVER w, 2) AS average_amount
    FROM daily
    WINDOW w AS (ORDER BY visited_on RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW)
) t
WHERE visited_on >= (SELECT MIN(visited_on) FROM daily) + 6
ORDER BY visited_on;
$sql$),

(602, 'postgresql', $sql$
SELECT id, COUNT(*) AS num
FROM (
    SELECT requester_id AS id FROM RequestAccepted
    UNION ALL
    SELECT accepter_id FROM RequestAccepted
) t
GROUP BY id
ORDER BY num DESC
LIMIT 1;
$sql$),

(585, 'postgresql', $sql$
SELECT ROUND(SUM(tiv_2016)::numeric, 2) AS tiv_2016
FROM (
    SELECT tiv_2016,
           COUNT(*) OVER (PARTITION BY tiv_2015) AS same_2015,
           COUNT(*) OVER (PARTITION BY lat, lon) AS same_location
    FROM Insurance
) t
WHERE same_2015 > 1 AND same_location = 1;
$sql$),

(185, 'postgresql', $sql$
SELECT d.name AS "Department", e.name AS "Employee", e.salary AS "Salary"
FROM (
    SELECT name, salary, departmentId,
           DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) AS rnk
    FROM Employee
) e
JOIN Department d ON e.departmentId = d.id
WHERE e.rnk <= 3;
$sql$),

(1667, 'postgresql', $sql$
SELECT user_id,
       UPPER(LEFT(name, 1)) || LOWER(SUBSTRING(name FROM 2)) AS name
FROM Users
ORDER BY user_id;
$sql$),

(1527, 'postgresql', $sql$
SELECT patient_id, patient_name, conditions
FROM Patients
WHERE conditions LIKE 'DIAB1%' OR conditions LIKE '% DIAB1%';
$sql$),

(196, 'postgresql', $sql$
DELETE FROM Person p
USING Person q
WHERE p.email = q.email AND p.id > q.id;
$sql$),

(176, 'postgresql', $sql$
SELECT (
    SELECT DISTINCT salary
    FROM Employee
    ORDER BY salary DESC
    LIMIT 1 OFFSET 1
) AS "SecondHighestSalary";
$sql$),

(1484, 'postgresql', $sql$
SELECT sell_date,
       COUNT(DISTINCT product) AS num_sold,
       STRING_AGG(DISTINCT product, ',' ORDER BY product) AS products
FROM Activities
GROUP BY sell_date
ORDER BY sell_date;
$sql$),

(1327, 'postgresql', $sql$
SELECT p.product_name, SUM(o.unit) AS unit
FROM Products p
JOIN Orders o ON p.product_id = o.product_id
WHERE o.order_date >= DATE '2020-02-01' AND o.order_date < DATE '2020-03-01'
GROUP BY p.product_id, p.product_name
HAVING SUM(o.unit) >= 100;
$sql$),

(1517, 'postgresql', $sql$
SELECT *
FROM Users
WHERE mail ~ '^[A-Za-z][A-Za-z0-9_.-]*@leetcode\.com$';
$sql$);

-- ============================================================
-- Step 5: sanity checks
-- ============================================================
SELECT (SELECT COUNT(*) FROM categories) AS categories,
       (SELECT COUNT(*) FROM problems)   AS problems,
       (SELECT COUNT(*) FROM solutions)  AS solutions;

-- Problems per group, with a solution count
SELECT c.position, c.name,
       COUNT(p.leetcode_id)  AS problems,
       COUNT(s.id)           AS solutions
FROM categories c
LEFT JOIN problems p  ON p.category_id = c.id
LEFT JOIN solutions s ON s.problem_id = p.leetcode_id
GROUP BY c.position, c.name
ORDER BY c.position;
