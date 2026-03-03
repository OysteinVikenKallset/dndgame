import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Container } from "@/components/ui/Container";
import {
  getPublicSettings,
  getPublishedPages,
  type CmsPublicPage,
} from "@/lib/cms";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Node CMS Website",
    template: "%s | Node CMS Website",
  },
  description:
    "Website frontend that renders published content from the CMS API.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [pages, settings] = await Promise.all([
    getPublishedPages({
      locale: "en",
      limit: 200,
    }),
    getPublicSettings({ locale: "en" }),
  ]);

  const pageBySlug = new Map<string, CmsPublicPage>();

  for (const page of pages) {
    pageBySlug.set(page.slug, page);
  }

  const headerPages = settings.menu.header.all
    ? pages
    : settings.menu.header.slugs
        .map((slug) => pageBySlug.get(slug))
        .filter((page): page is CmsPublicPage => Boolean(page));
  const footerPages = settings.menu.footer.all
    ? pages
    : settings.menu.footer.slugs
        .map((slug) => pageBySlug.get(slug))
        .filter((page): page is CmsPublicPage => Boolean(page));

  const uniqueHeaderPages = Array.from(
    new Map(headerPages.map((page) => [page.slug, page])).values(),
  );
  const uniqueFooterPages = Array.from(
    new Map(footerPages.map((page) => [page.slug, page])).values(),
  );

  const availableHeaderPages =
    uniqueHeaderPages.length > 0 || settings.menu.header.all
      ? uniqueHeaderPages
      : pages;
  const availableFooterPages =
    uniqueFooterPages.length > 0 || settings.menu.footer.all
      ? uniqueFooterPages
      : pages;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="flex min-h-screen flex-col">
          <SiteHeader pages={availableHeaderPages} />
          <main id="main-content" className="flex-1 py-12 sm:py-16">
            <Container width="site">{children}</Container>
          </main>
          <SiteFooter pages={availableFooterPages} />
        </div>
      </body>
    </html>
  );
}
