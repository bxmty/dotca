import fs from "fs";
import path from "path";
import { parseFrontmatter } from "@/lib/parseFrontmatter";
import { LeadMagnet, LeadMagnetFrontmatter } from "@/types/leadMagnet";

/**
 * Lead magnets are content-as-code, mirroring content/blog. Their PDFs live in
 * content/lead-magnets/assets — deliberately outside public/, so a PDF has no
 * static URL and can only be reached through the signed download route.
 */
const LEAD_MAGNET_CONTENT_DIR = path.join(
  process.cwd(),
  "content",
  "lead-magnets",
);
export const LEAD_MAGNET_ASSETS_DIR = path.join(
  LEAD_MAGNET_CONTENT_DIR,
  "assets",
);

// Same guard blog.ts uses against path traversal, kept case-sensitive so a
// slug maps to exactly one file on case-sensitive and case-insensitive disks.
const SLUG_PATTERN = /^[a-z0-9-]+$/;
// assetFile is joined onto LEAD_MAGNET_ASSETS_DIR, so it must be a bare filename.
const ASSET_FILE_PATTERN = /^[a-z0-9-]+\.pdf$/i;

export function isLeadMagnetSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

function parseLeadMagnet(slug: string): LeadMagnet | null {
  const filePath = path.join(LEAD_MAGNET_CONTENT_DIR, `${slug}.md`);
  try {
    const { data, content } = parseFrontmatter<Partial<LeadMagnetFrontmatter>>(
      fs.readFileSync(filePath, "utf8"),
    );

    if (!data.title || !data.description || !data.date || !data.assetFile) {
      console.warn(`Lead magnet ${slug} is missing required frontmatter`);
      return null;
    }

    if (!ASSET_FILE_PATTERN.test(data.assetFile)) {
      console.warn(`Lead magnet ${slug} has an invalid assetFile`);
      return null;
    }

    const frontmatter: LeadMagnetFrontmatter = {
      title: data.title,
      description: data.description,
      date: String(data.date),
      published: data.published !== false,
      assetFile: data.assetFile,
      slug,
    };
    if (data.assetLabel) frontmatter.assetLabel = data.assetLabel;
    if (data.relatedBlogSlug)
      frontmatter.relatedBlogSlug = data.relatedBlogSlug;

    return { frontmatter, content, slug };
  } catch (error) {
    // Unknown slugs are routine on a public route; only log real failures.
    if ((error as { code?: unknown }).code !== "ENOENT") {
      console.error(`Error parsing lead magnet ${slug}:`, error);
    }
    return null;
  }
}

/**
 * Get a published lead magnet by slug, or null when the slug is invalid,
 * the magnet doesn't exist, or it isn't published.
 */
export function getLeadMagnetBySlug(slug: string): LeadMagnet | null {
  if (!isLeadMagnetSlug(slug)) {
    return null;
  }

  const magnet = parseLeadMagnet(slug);
  return magnet?.frontmatter.published ? magnet : null;
}

/**
 * Get all published lead magnets, newest first.
 */
export function getAllLeadMagnets(): LeadMagnet[] {
  let files: string[];
  try {
    files = fs.readdirSync(LEAD_MAGNET_CONTENT_DIR);
  } catch {
    console.warn("Lead magnet content directory not found");
    return [];
  }

  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => getLeadMagnetBySlug(path.basename(file, ".md")))
    .filter((magnet): magnet is LeadMagnet => magnet !== null)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    );
}
