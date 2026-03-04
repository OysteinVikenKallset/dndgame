import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const variantClasses: Record<
  NonNullable<ButtonLinkProps["variant"]>,
  string
> = {
  primary: "bg-action text-white hover:bg-action-hover active:bg-action-active",
  secondary: "bg-surface-2 text-text border border-border hover:bg-surface",
  ghost: "bg-transparent text-text hover:bg-surface-2",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-medium no-underline transition ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
