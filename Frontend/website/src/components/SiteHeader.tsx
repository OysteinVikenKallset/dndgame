import Link from "next/link";
import { getCmsAdminUrl, type CmsPublicPage } from "@/lib/cms";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { curatePublicPages } from "@/components/curate-public-pages";

type SiteHeaderProps = {
  pages: CmsPublicPage[];
};

export function SiteHeader({ pages }: SiteHeaderProps) {
  const topPages = curatePublicPages(pages, 6);
  const cmsAdminUrl = getCmsAdminUrl();

  return (
    <header className="border-b border-border bg-surface/95 backdrop-blur">
      <Container width="site" className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight no-underline"
          >
            Node CMS Website
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-2 sm:justify-end"
          >
            {topPages.map((page) => (
              <Link
                key={`${page.locale}:${page.slug}`}
                href={`/${page.slug}`}
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium no-underline hover:bg-surface-2"
              >
                {page.title}
              </Link>
            ))}
            <ButtonLink
              href={cmsAdminUrl}
              variant="secondary"
              className="min-h-11"
            >
              CMS Admin
            </ButtonLink>
          </nav>
        </div>
      </Container>
    </header>
  );
}
