import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface px-5 py-5 shadow-sm ${className}`.trim()}
    >
      {children}
    </section>
  );
}
