import type { ReactNode } from "react";

type CmsPageViewProps = {
  title: string;
  showTitle?: boolean;
  template: "page" | "post";
  lead?: string;
  createdAt: string;
  children: ReactNode;
};

export function CmsPageView({
  title,
  showTitle = true,
  template,
  lead,
  createdAt,
  children,
}: CmsPageViewProps) {
  return (
    <article className="w-full">
      <header className="mb-10 pt-2 sm:pt-4">
        {showTitle ? (
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>
        ) : null}
        {template === "post" ? (
          <p
            className={`${showTitle ? "mt-2" : "mt-0"} text-sm text-text-muted`}
          >
            Created {new Date(createdAt).toLocaleDateString("en-GB")}
          </p>
        ) : null}
        {lead ? (
          <p className="mt-4 text-base leading-7 text-text-muted">{lead}</p>
        ) : null}
      </header>

      <section className="space-y-6 text-base leading-7 text-text">
        {children}
      </section>
    </article>
  );
}
