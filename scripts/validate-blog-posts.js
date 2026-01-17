#!/usr/bin/env node

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BLOG_DIR = path.join(__dirname, "..", "content", "blog");
const REQUIRED_FRONTMATTER = ["title", "description", "date", "author"];
const OPTIONAL_FRONTMATTER = [
  "tags",
  "published",
  "featured",
  "readingTime",
  "coverImage",
];

class BlogPostValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validPosts = 0;
  }

  /**
   * Validate a single blog post file
   */
  validateBlogPost(filePath) {
    const fileName = path.basename(filePath, ".mdx");

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const { data, content: body } = matter(content);

      // Check required frontmatter
      for (const field of REQUIRED_FRONTMATTER) {
        if (!data[field]) {
          this.errors.push(
            `${fileName}: Missing required frontmatter field '${field}'`,
          );
        }
      }

      // Validate date format
      if (data.date && !this.isValidDate(data.date)) {
        this.errors.push(
          `${fileName}: Invalid date format '${data.date}'. Use YYYY-MM-DD format.`,
        );
      }

      // Validate tags
      if (data.tags && !Array.isArray(data.tags)) {
        this.errors.push(`${fileName}: 'tags' must be an array`);
      }

      // Validate published status
      if (data.published !== undefined && typeof data.published !== "boolean") {
        this.errors.push(`${fileName}: 'published' must be a boolean`);
      }

      // Validate featured status
      if (data.featured !== undefined && typeof data.featured !== "boolean") {
        this.errors.push(`${fileName}: 'featured' must be a boolean`);
      }

      // Check for empty content
      if (!body.trim()) {
        this.errors.push(`${fileName}: Blog post has no content`);
      }

      // Check content length
      if (body.trim().length < 100) {
        this.warnings.push(
          `${fileName}: Blog post content is very short (${body.trim().length} characters)`,
        );
      }

      // Check title length
      if (data.title && data.title.length > 60) {
        this.warnings.push(
          `${fileName}: Title is very long (${data.title.length} characters). Consider shortening for SEO.`,
        );
      }

      // Check description length
      if (data.description && data.description.length > 160) {
        this.warnings.push(
          `${fileName}: Description is very long (${data.description.length} characters). Consider shortening for SEO.`,
        );
      }

      // Check if slug matches filename
      const slugFromFrontmatter = data.slug || fileName;
      if (slugFromFrontmatter !== fileName) {
        this.warnings.push(
          `${fileName}: Slug '${slugFromFrontmatter}' doesn't match filename`,
        );
      }

      // Validate cover image path
      if (data.coverImage && !data.coverImage.startsWith("/")) {
        this.warnings.push(
          `${fileName}: Cover image should start with '/' for proper path resolution`,
        );
      }

      // Check for duplicate titles (basic check)
      // This would be more comprehensive with a full scan

      if (this.errors.length === 0) {
        this.validPosts++;
      }
    } catch (error) {
      this.errors.push(
        `${fileName}: Error reading or parsing file - ${error.message}`,
      );
    }
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate all blog posts in the blog directory
   */
  validateAllPosts() {
    console.log("🔍 Validating blog posts...\n");

    if (!fs.existsSync(BLOG_DIR)) {
      console.error(`❌ Blog directory not found: ${BLOG_DIR}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(BLOG_DIR)
      .filter((file) => file.endsWith(".mdx"));

    if (files.length === 0) {
      console.warn("⚠️  No blog posts found in the blog directory");
      return;
    }

    console.log(`📝 Found ${files.length} blog post(s) to validate\n`);

    files.forEach((file) => {
      const filePath = path.join(BLOG_DIR, file);
      this.validateBlogPost(filePath);
    });

    // Report results
    this.printResults();

    // Exit with appropriate code
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    if (this.errors.length > 0) {
      console.log("❌ Validation Errors:");
      this.errors.forEach((error) => console.log(`  • ${error}`));
      console.log("");
    }

    if (this.warnings.length > 0) {
      console.log("⚠️  Validation Warnings:");
      this.warnings.forEach((warning) => console.log(`  • ${warning}`));
      console.log("");
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("✅ All blog posts passed validation!");
    }

    console.log(
      `📊 Summary: ${this.validPosts} valid, ${this.errors.length} errors, ${this.warnings.length} warnings`,
    );
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new BlogPostValidator();
  validator.validateAllPosts();
}

export default BlogPostValidator;
