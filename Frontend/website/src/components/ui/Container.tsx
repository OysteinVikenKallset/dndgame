import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  width?: "site" | "content";
  className?: string;
};

export function Container({
  children,
  width = "site",
  className = "",
}: ContainerProps) {
  const maxWidth = width === "content" ? "max-w-3xl" : "max-w-6xl";

  return (
    <div
      className={`mx-auto w-full ${maxWidth} px-4 sm:px-6 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
