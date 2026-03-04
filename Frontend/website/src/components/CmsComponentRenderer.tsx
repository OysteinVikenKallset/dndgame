import { toCmsAssetUrl, type CmsComponentInstance } from "@/lib/cms";
import { AlertBlock } from "@/components/ui/AlertBlock";
import { Prose } from "@/components/ui/Prose";

type CmsComponentRendererProps = {
  components: CmsComponentInstance[];
};

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function RichTextBlock({ props }: { props: Record<string, unknown> }) {
  const html = asString(props["html"]);

  if (!html) {
    return null;
  }

  return (
    <Prose>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Prose>
  );
}

function ImageBlock({ props }: { props: Record<string, unknown> }) {
  const url = asString(props["url"]);
  const alt = asString(props["alt"]);
  const caption = asString(props["caption"]);

  if (!url || !alt) {
    return null;
  }

  return (
    <figure>
      <img src={toCmsAssetUrl(url)} alt={alt} className="w-full rounded-xl" />
      {caption ? (
        <p className="mt-2 text-sm text-text-muted">{caption}</p>
      ) : null}
    </figure>
  );
}

function TextImageBlock({ props }: { props: Record<string, unknown> }) {
  const title = asString(props["title"]);
  const text = asString(props["text"]);
  const url = asString(props["url"]);
  const alt = asString(props["alt"]);
  const layout = asString(props["layout"]);

  if (!text || !url || !alt) {
    return null;
  }

  const reversed = layout === "imageRight";

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${reversed ? "" : ""}`}>
      <div className={reversed ? "md:order-1" : "md:order-2"}>
        <img src={toCmsAssetUrl(url)} alt={alt} className="w-full rounded-xl" />
      </div>
      <div className={reversed ? "md:order-2" : "md:order-1"}>
        {title ? (
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        ) : null}
        <Prose className={title ? "mt-2" : undefined}>
          <p className="whitespace-pre-wrap">{text}</p>
        </Prose>
      </div>
    </div>
  );
}

function QuoteBlock({ props }: { props: Record<string, unknown> }) {
  const quote = asString(props["quote"]);
  const author = asString(props["author"]);

  if (!quote) {
    return null;
  }

  return (
    <figure>
      <blockquote className="border-l-4 border-border pl-4 text-lg italic">
        {quote}
      </blockquote>
      {author ? (
        <p className="mt-2 text-sm text-text-muted">— {author}</p>
      ) : null}
    </figure>
  );
}

function HeadlineBlock({ props }: { props: Record<string, unknown> }) {
  const text = asString(props["text"]);
  const level = asString(props["level"]);

  if (!text) {
    return null;
  }

  const normalizedLevel =
    level === "h1" ||
    level === "h2" ||
    level === "h3" ||
    level === "h4" ||
    level === "h5" ||
    level === "h6"
      ? level
      : "h2";

  const HeadingTag = normalizedLevel;
  const headingClass =
    normalizedLevel === "h1"
      ? "text-4xl font-bold tracking-tight"
      : normalizedLevel === "h2"
        ? "text-3xl font-semibold tracking-tight"
        : normalizedLevel === "h3"
          ? "text-2xl font-semibold tracking-tight"
          : normalizedLevel === "h4"
            ? "text-xl font-semibold tracking-tight"
            : normalizedLevel === "h5"
              ? "text-lg font-semibold"
              : "text-base font-semibold";

  return <HeadingTag className={headingClass}>{text}</HeadingTag>;
}

function ButtonBlock({ props }: { props: Record<string, unknown> }) {
  const label = asString(props["label"]);
  const url = asString(props["url"]);
  const openInNewTab = props["openInNewTab"];

  if (!label || !url) {
    return null;
  }

  const target = openInNewTab === true ? "_blank" : undefined;
  const rel = openInNewTab === true ? "noopener noreferrer" : undefined;

  return (
    <a
      href={url}
      target={target}
      rel={rel}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-action px-4 py-2 text-sm font-medium text-white no-underline transition hover:bg-action-hover active:bg-action-active"
    >
      {label}
    </a>
  );
}

function GridBlock({ props }: { props: Record<string, unknown> }) {
  const width = asString(props["width"]);
  const contentAlign = asString(props["contentAlign"]);
  const selfAlign = asString(props["selfAlign"]);
  const nestedRaw = props["components"];

  if (!Array.isArray(nestedRaw)) {
    return null;
  }

  const nestedComponents = nestedRaw.filter(
    (entry): entry is CmsComponentInstance =>
      isRecord(entry) &&
      typeof entry["componentType"] === "string" &&
      isRecord(entry["props"]),
  );

  const widthPercentage =
    width === "100" || width === "50" || width === "33" || width === "25"
      ? Number(width)
      : 100;

  const justifyClass =
    selfAlign === "center"
      ? "justify-center"
      : selfAlign === "right"
        ? "justify-end"
        : "justify-start";

  const itemsClass =
    contentAlign === "center"
      ? "items-center"
      : contentAlign === "right"
        ? "items-end"
        : "items-start";

  const textAlignClass =
    contentAlign === "center"
      ? "text-center"
      : contentAlign === "right"
        ? "text-right"
        : "text-left";

  return (
    <div className={`flex w-full ${justifyClass}`}>
      <div
        className={`flex flex-col gap-4 ${itemsClass} ${textAlignClass}`}
        style={{ width: `${widthPercentage}%` }}
      >
        {nestedComponents.map((component, index) =>
          renderComponent(component, `grid-${index}`),
        )}
      </div>
    </div>
  );
}

function UnknownBlock({ componentType }: { componentType: string }) {
  return (
    <AlertBlock
      title="Unknown component"
      message={`Component type \"${componentType}\" is not supported by the website renderer.`}
      tone="warning"
    />
  );
}

function renderComponent(component: CmsComponentInstance, key: string) {
  if (component.componentType === "richText") {
    return <RichTextBlock key={key} props={component.props} />;
  }

  if (component.componentType === "image") {
    return <ImageBlock key={key} props={component.props} />;
  }

  if (component.componentType === "textImage") {
    return <TextImageBlock key={key} props={component.props} />;
  }

  if (component.componentType === "quote") {
    return <QuoteBlock key={key} props={component.props} />;
  }

  if (component.componentType === "headline") {
    return <HeadlineBlock key={key} props={component.props} />;
  }

  if (component.componentType === "button") {
    return <ButtonBlock key={key} props={component.props} />;
  }

  if (component.componentType === "grid") {
    return <GridBlock key={key} props={component.props} />;
  }

  return <UnknownBlock key={key} componentType={component.componentType} />;
}

export function CmsComponentRenderer({
  components,
}: CmsComponentRendererProps) {
  if (components.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {components.map((component, index) =>
        renderComponent(component, `${component.componentType}-${index}`),
      )}
    </div>
  );
}
