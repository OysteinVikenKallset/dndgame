import type { CmsPublicPage } from "@/lib/cms";

function comparePages(left: CmsPublicPage, right: CmsPublicPage): number {
  const leftIsHome = left.slug === "home";
  const rightIsHome = right.slug === "home";

  if (leftIsHome && !rightIsHome) {
    return -1;
  }

  if (!leftIsHome && rightIsHome) {
    return 1;
  }

  const titleCompare = left.title.localeCompare(right.title, undefined, {
    sensitivity: "base",
  });

  if (titleCompare !== 0) {
    return titleCompare;
  }

  const slugCompare = left.slug.localeCompare(right.slug, undefined, {
    sensitivity: "base",
  });

  if (slugCompare !== 0) {
    return slugCompare;
  }

  return left.locale.localeCompare(right.locale, undefined, {
    sensitivity: "base",
  });
}

export function curatePublicPages(
  pages: CmsPublicPage[],
  limit: number,
): CmsPublicPage[] {
  const sorted = [...pages].sort(comparePages);

  const seenSlugs = new Set<string>();
  const seenTitles = new Set<string>();
  const curated: CmsPublicPage[] = [];

  for (const page of sorted) {
    const slugKey = `${page.locale}:${page.slug}`.toLowerCase();
    const titleKey = page.title.trim().toLowerCase();

    if (seenSlugs.has(slugKey) || seenTitles.has(titleKey)) {
      continue;
    }

    curated.push(page);
    seenSlugs.add(slugKey);
    seenTitles.add(titleKey);

    if (curated.length >= limit) {
      break;
    }
  }

  return curated;
}
