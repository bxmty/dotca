/**
 * Download button text when a lead magnet's frontmatter sets no assetLabel
 * (LeadMagnetFrontmatter.assetLabel). Kept out of lead-magnets.ts, which reads
 * the filesystem, so client components such as LeadMagnetGate can import it.
 */
export const DEFAULT_LEAD_MAGNET_ASSET_LABEL = "Download the guide";
