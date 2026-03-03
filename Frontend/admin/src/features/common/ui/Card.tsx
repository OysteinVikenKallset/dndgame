import type { CSSProperties, ReactElement, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  subtle?: boolean;
  style?: CSSProperties;
};

export function Card({
  children,
  className,
  subtle = false,
  style,
}: CardProps): ReactElement {
  return (
    <section
      style={style}
      className={["ui-card", subtle ? "ui-card--subtle" : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
