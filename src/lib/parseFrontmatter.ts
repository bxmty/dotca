import { load } from "js-yaml";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export interface ParsedFrontmatter<T extends object> {
  data: T;
  content: string;
}

export function parseFrontmatter<T extends object = Record<string, unknown>>(
  fileContents: string,
): ParsedFrontmatter<T> {
  const match = fileContents.match(FRONTMATTER_PATTERN);

  if (!match) {
    return { data: {} as T, content: fileContents };
  }

  const parsedData = load(match[1]);
  const data =
    parsedData !== null && typeof parsedData === "object"
      ? (parsedData as T)
      : ({} as T);

  return { data, content: match[2] };
}
