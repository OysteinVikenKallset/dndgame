import Link from "next/link";
import { getCmsAdminUrl, type CmsPublicPage } from "@/lib/cms";
import { Container } from "@/components/ui/Container";
import { curatePublicPages } from "@/components/curate-public-pages";

type SiteFooterProps = {
  pages: CmsPublicPage[];
};

export function SiteFooter({ pages }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const footerPages = curatePublicPages(pages, 8);
  const cmsAdminUrl = getCmsAdminUrl();

  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <Container width="site" className="py-10">
        {footerPages.length > 0 ? (
          <nav aria-label="Footer navigation" className="mb-6">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {footerPages.map((page) => (
                <li key={`${page.locale}:${page.slug}`}>
                  <Link
                    href={`/${page.slug}`}
                    className="text-sm text-text-muted no-underline hover:text-text"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <p className="text-sm text-text-muted">
          © {year} Node CMS Website · Contact ·{" "}
          <a href={cmsAdminUrl} className="text-text-muted hover:text-text">
            CMS Admin
          </a>
        </p>
      </Container>
    </footer>
  );
}
