import type { DbLab } from "./types";

/** Category 1: Select. Every seed creates 5,000 to 20,000 rows. */
export const LABS_SELECT: DbLab[] = [
  {
    id: 1757,
    issue: "A catalogue of 10,000 products where only some are both low-fat and recyclable.",
    seed: `
CREATE TABLE Products (product_id INT PRIMARY KEY, low_fats CHAR(1), recyclable CHAR(1));
INSERT INTO Products
SELECT g,
       CASE WHEN random() < 0.55 THEN 'Y' ELSE 'N' END,
       CASE WHEN random() < 0.45 THEN 'Y' ELSE 'N' END
FROM generate_series(1, 10000) g;
`,
  },
  {
    id: 584,
    issue: "10,000 customers; about a fifth were referred by customer 2 and many have no referee (NULL).",
    seed: `
CREATE TABLE Customer (id INT PRIMARY KEY, name TEXT, referee_id INT);
INSERT INTO Customer
SELECT g, 'customer_' || g,
       CASE WHEN r < 0.40 THEN NULL
            WHEN r < 0.60 THEN 2
            ELSE 1 + floor(random() * 10000)::int END
FROM (SELECT g, random() AS r FROM generate_series(1, 10000) g) t;
`,
  },
  {
    id: 595,
    issue: "A world table of 5,000 countries with a mix of large-area and high-population ones.",
    seed: `
CREATE TABLE World (name TEXT PRIMARY KEY, continent TEXT, area INT, population INT, gdp BIGINT);
INSERT INTO World
SELECT 'country_' || g,
       (ARRAY['Asia','Europe','Africa','Americas','Oceania'])[1 + floor(random() * 5)::int],
       (random() * 9000000)::int,
       (random() * 90000000)::int,
       (random() * 900000000000)::bigint
FROM generate_series(1, 5000) g;
`,
  },
  {
    id: 1148,
    issue: "20,000 article views, some by authors viewing their own articles, with duplicate rows.",
    seed: `
CREATE TABLE Views (article_id INT, author_id INT, viewer_id INT, view_date DATE);
INSERT INTO Views
SELECT a, au, CASE WHEN random() < 0.08 THEN au ELSE 1 + floor(random() * 2000)::int END,
       DATE '2019-01-01' + floor(random() * 365)::int
FROM (SELECT g AS a, 1 + (g % 1500) AS au FROM generate_series(1, 20000) g) t;
INSERT INTO Views SELECT * FROM Views WHERE random() < 0.05;
`,
  },
  {
    id: 1683,
    issue: "15,000 tweets; a share of them exceed the 15-character limit.",
    seed: `
CREATE TABLE Tweets (tweet_id INT PRIMARY KEY, content TEXT);
INSERT INTO Tweets
SELECT g, left(repeat('x', 1 + floor(random() * 25)::int), 1 + floor(random() * 25)::int)
FROM generate_series(1, 15000) g;
`,
  },
];
