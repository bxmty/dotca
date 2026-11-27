export interface LeadMagnetFrontmatter {
  title: string;
  /** Gate-page copy and meta description. */
  description: string;
  date: string;
  /**
   * Always set by the loader: a file that omits it is published, the same
   * semantics as BlogPostFrontmatter.published.
   */
  published: boolean;
  /** Bare PDF filename under content/lead-magnets/assets/. */
  assetFile: string;
  /** Download button text; consumers default it to DEFAULT_LEAD_MAGNET_ASSET_LABEL. */
  assetLabel?: string;
  /** Optional backlink to an ungated companion blog post. */
  relatedBlogSlug?: string;
}

export interface LeadMagnet {
  frontmatter: LeadMagnetFrontmatter;
  /** Markdown value-prop body, rendered like a blog post. */
  content: string;
  /** From the filename (`<slug>.md`), never from frontmatter. */
  slug: string;
}
