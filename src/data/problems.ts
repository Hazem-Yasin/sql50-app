import data from "./problems.json";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  position: number;
  postgresql: string;
}

export interface Category {
  name: string;
  position: number;
}

export const categories: Category[] = data.categories;
export const problems = data.problems as Problem[];

export function getProblem(id: number): Problem | undefined {
  return problems.find((p) => p.id === id);
}

export function leetcodeUrl(problem: Problem): string {
  return `https://leetcode.com/problems/${problem.slug}/`;
}
