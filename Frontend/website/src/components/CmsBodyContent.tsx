import { Prose } from "@/components/ui/Prose";

type CmsBodyContentProps = {
  bodyRichText?: string;
};

function splitParagraphs(bodyRichText?: string): string[] {
  if (!bodyRichText) {
    return [];
  }

  return bodyRichText
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function CmsBodyContent({ bodyRichText }: CmsBodyContentProps) {
  const paragraphs = splitParagraphs(bodyRichText);

  if (paragraphs.length === 0) {
    return <p className="text-text-muted">No body content provided.</p>;
  }

  return (
    <Prose>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}
    </Prose>
  );
}
