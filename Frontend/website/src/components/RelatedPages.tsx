import Link from "next/link";
import type { CmsPublicPage } from "@/lib/cms";
import { Card } from "@/components/ui/Card";
import { curatePublicPages } from "@/components/curate-public-pages";

type RelatedPagesProps = {
  pages: CmsPublicPage[];
};

export function RelatedPages({ pages }: RelatedPagesProps) {
  const relatedPages = curatePublicPages(pages, 8);

  if (relatedPages.length === 0) {
    return null;
  }

  return (
    <aside className="mt-12 border-t border-border pt-8">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">
        Related pages
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {relatedPages.map((page) => (
          <li key={`${page.locale}:${page.slug}`}>
            <Card className="h-full p-0 transition hover:border-primary/40 hover:bg-surface-2">
              <Link
                href={`/${page.slug}`}
                className="block rounded-xl px-4 py-4 no-underline"
              >
                <p className="text-base font-medium text-text">{page.title}</p>
                <p className="mt-1 text-sm text-text-muted">Read page</p>
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </aside>
  );
}
