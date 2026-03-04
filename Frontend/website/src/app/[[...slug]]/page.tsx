import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsComponentRenderer } from "@/components/CmsComponentRenderer";
import { CmsPageView } from "@/components/CmsPageView";
import { CmsBodyContent } from "@/components/CmsBodyContent";
import { RelatedPages } from "@/components/RelatedPages";
import {
  getPublicPageBySlug,
  getRelatedPages,
  resolveHomepageSlug,
} from "@/lib/cms";

type PageProps = {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams: Promise<{
    locale?: string;
  }>;
};

function toSlug(segments?: string[]): string | null {
  if (!segments || segments.length === 0) {
    return null;
  }

  return segments.join("/");
}

async function resolveRequestedSlug(
  params: Promise<{ slug?: string[] }>,
  searchParams: Promise<{ locale?: string }>,
): Promise<{ slug: string; locale: string }> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const requestedSlug = toSlug(resolvedParams.slug);
  const locale =
    typeof resolvedSearchParams.locale === "string" &&
    resolvedSearchParams.locale.trim()
      ? resolvedSearchParams.locale.trim()
      : "en";

  return {
    slug: requestedSlug ?? (await resolveHomepageSlug({ locale })) ?? "home",
    locale,
  };
}

function toDescription(text?: string): string {
  if (!text || text.trim().length === 0) {
    return "Published content page rendered from CMS.";
  }

  return text.trim().slice(0, 160);
}

function toDescriptionFromComponents(
  components?: Array<{
    componentType: string;
    props: Record<string, unknown>;
  }>,
): string | null {
  if (!Array.isArray(components) || components.length === 0) {
    return null;
  }

  for (const component of components) {
    if (component.componentType === "richText") {
      const html = component.props["html"];

      if (typeof html === "string" && html.trim().length > 0) {
        return html
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160);
      }
    }

    if (component.componentType === "quote") {
      const quote = component.props["quote"];

      if (typeof quote === "string" && quote.trim().length > 0) {
        return quote.trim().slice(0, 160);
      }
    }
  }

  return null;
}

function splitParagraphs(text?: string): string[] {
  if (!text) {
    return [];
  }

  return text
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function extractLeadAndBody(text?: string): {
  lead?: string;
  bodyWithoutLead?: string;
} {
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length === 0) {
    return {};
  }

  const [firstParagraph, ...rest] = paragraphs;

  const lead = firstParagraph.slice(0, 220);

  if (rest.length === 0) {
    return { lead };
  }

  return {
    lead,
    bodyWithoutLead: rest.join("\n\n"),
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await resolveRequestedSlug(params, searchParams);
  const page = await getPublicPageBySlug({ slug, locale });

  if (!page) {
    return {
      title: "Page not found",
      description: "Requested content page was not found.",
    };
  }

  return {
    title: page.title,
    description:
      toDescriptionFromComponents(page.components) ??
      toDescription(page.bodyRichText),
  };
}

export default async function CatchAllPage({
  params,
  searchParams,
}: PageProps) {
  const { slug, locale } = await resolveRequestedSlug(params, searchParams);

  const page = await getPublicPageBySlug({ slug, locale });

  if (!page) {
    notFound();
  }

  const relatedPages = await getRelatedPages({
    locale,
    excludeSlug: page.slug,
  });
  const { lead, bodyWithoutLead } = extractLeadAndBody(page.bodyRichText);
  const template = page.template === "post" ? "post" : "page";
  const createdAt = page.createdAt ?? page.publishedAt;

  return (
    <CmsPageView
      title={page.title}
      showTitle={page.showTitle}
      template={template}
      lead={lead}
      createdAt={createdAt}
    >
      {Array.isArray(page.components) && page.components.length > 0 ? (
        <CmsComponentRenderer components={page.components} />
      ) : null}
      {bodyWithoutLead ? (
        <CmsBodyContent bodyRichText={bodyWithoutLead} />
      ) : null}
      <RelatedPages pages={relatedPages} />
    </CmsPageView>
  );
}
