import type { CmsComponentInstance } from "@/lib/cms";
import { AlertBlock } from "@/components/ui/AlertBlock";
import { Card } from "@/components/ui/Card";
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

function RichTextBlock({ props }: { props: Record<string, unknown> }) {
  const html = asString(props["html"]);

  if (!html) {
    return null;
  }

  return (
    <Card>
      <Prose>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Prose>
    </Card>
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
    <Card>
      <img src={url} alt={alt} className="w-full rounded-xl" />
      {caption ? (
        <p className="mt-2 text-sm text-text-muted">{caption}</p>
      ) : null}
    </Card>
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
    <Card>
      <div className={`grid gap-4 md:grid-cols-2 ${reversed ? "" : ""}`}>
        <div className={reversed ? "md:order-1" : "md:order-2"}>
          <img src={url} alt={alt} className="w-full rounded-xl" />
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
    </Card>
  );
}

function QuoteBlock({ props }: { props: Record<string, unknown> }) {
  const quote = asString(props["quote"]);
  const author = asString(props["author"]);

  if (!quote) {
    return null;
  }

  return (
    <Card>
      <blockquote className="border-l-4 border-border pl-4 text-lg italic">
        {quote}
      </blockquote>
      {author ? (
        <p className="mt-2 text-sm text-text-muted">— {author}</p>
      ) : null}
    </Card>
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

export function CmsComponentRenderer({
  components,
}: CmsComponentRendererProps) {
  if (components.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {components.map((component, index) => {
        const key = `${component.componentType}-${index}`;

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

        return (
          <UnknownBlock key={key} componentType={component.componentType} />
        );
      })}
    </div>
  );
}
