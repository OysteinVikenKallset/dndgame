import type { ReactElement } from "react";

type BadgeTone = "neutral" | "success" | "warning";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

function toneFromStatus(status: string): BadgeTone {
  if (status === "PUBLISHED") {
    return "success";
  }

  if (status === "ARCHIVED") {
    return "warning";
  }

  return "neutral";
}

export function Badge({ label, tone }: BadgeProps): ReactElement {
  const resolvedTone = tone ?? toneFromStatus(label);

  return (
    <span className={`ui-badge ui-badge--${resolvedTone}`} aria-label={label}>
      {label}
    </span>
  );
}
