export interface LeadMagnetAsset {
  /** Bare `.pdf` or `.docx` filename under content/lead-magnets/assets/. */
  file: string;
  /** Text of this file's download link. */
  label: string;
}

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
  /**
   * Input only: the single-file form, a bare filename under
   * content/lead-magnets/assets/. The loader folds it into `assets`.
   */
  assetFile?: string;
  /**
   * Download button text: the single file's label, or the first assetFiles
   * label. Consumers default it to DEFAULT_LEAD_MAGNET_ASSET_LABEL.
   */
  assetLabel?: string;
  /** Input only: the multi-file form, used instead of assetFile. */
  assetFiles?: LeadMagnetAsset[];
  /** Always set by the loader: every file the magnet delivers, in order. */
  assets: LeadMagnetAsset[];
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
