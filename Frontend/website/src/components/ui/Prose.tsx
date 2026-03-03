import type { ReactNode } from "react";

type ProseProps = {
  children: ReactNode;
  className?: string;
};

export function Prose({ children, className = "" }: ProseProps) {
  return <div className={`ui-prose ${className}`.trim()}>{children}</div>;
}
