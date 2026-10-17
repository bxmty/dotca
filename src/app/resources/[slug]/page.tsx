import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllLeadMagnets, getLeadMagnetBySlug } from "@/lib/lead-magnets";
import LeadMagnetGate from "@/app/components/LeadMagnetGate";
import { markdownComponents } from "@/app/components/markdownComponents";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllLeadMagnets().map((magnet) => ({ slug: magnet.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const magnet = getLeadMagnetBySlug(slug);

  if (!magnet) {
    return { title: "Resource Not Found" };
  }

  const { title, description } = magnet.frontmatter;
  return {
    title: `${title} | Resources`,
    description,
    alternates: { canonical: `/resources/${slug}` },
    openGraph: { title, description, type: "website" },
  };
}

// A lead magnet's landing page: its value-prop body, rendered like a blog
// post, beside the email gate that unlocks the download.
export default async function ResourcePage({ params }: PageProps) {
  const { slug } = await params;
  const magnet = getLeadMagnetBySlug(slug);

  if (!magnet || !magnet.frontmatter.published) {
    notFound();
  }

  const { title, description, assetLabel } = magnet.frontmatter;

  return (
    <div className="pb-12 md:pb-24">
      <header className="grid gap-4.5 px-4 pt-14 pb-10 md:px-7 lg:grid-cols-12 lg:items-end lg:gap-10">
        <h1 className="m-0 text-h2 leading-[1.04] font-light tracking-[-0.02em] text-balance md:text-section lg:col-span-7 lg:text-display">
          {title}
        </h1>
        <p className="m-0 text-h3 leading-[1.4] text-muted lg:col-span-5">
          {description}
        </p>
      </header>

      <div className="grid gap-10 border-t border-rule px-4 pt-10 md:px-7 lg:grid-cols-12">
        <article className="prose lg:col-span-7">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {magnet.content}
          </ReactMarkdown>
        </article>
        <aside className="lg:col-span-5">
          <LeadMagnetGate slug={slug} title={title} assetLabel={assetLabel} />
        </aside>
      </div>
    </div>
  );
}
