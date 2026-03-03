import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "secondary",
  loading = false,
  disabled,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps): ReactElement {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type}
      className={[
        "ui-button",
        `ui-button--${variant}`,
        loading ? "is-loading" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
