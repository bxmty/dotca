export interface LeadMagnetFrontmatter {
  title: string;
  /** Gate-page copy and meta description. */
  description: string;
  date: string;
  /** Same semantics as BlogPostFrontmatter.published: omitted means published. */
  published?: boolean;
  /** Bare PDF filename under content/lead-magnets/assets/. */
  assetFile: string;
  /** Download button text; consumers default it to DEFAULT_LEAD_MAGNET_ASSET_LABEL. */
  assetLabel?: string;
  /** Optional backlink to an ungated companion blog post. */
  relatedBlogSlug?: string;
  slug: string;
}

export interface LeadMagnet {
  frontmatter: LeadMagnetFrontmatter;
  /** Markdown value-prop body, rendered like a blog post. */
  content: string;
  slug: string;
}
