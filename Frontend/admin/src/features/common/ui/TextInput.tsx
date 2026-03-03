import type { InputHTMLAttributes, ReactElement } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({
  className,
  ...props
}: TextInputProps): ReactElement {
  return (
    <input
      className={["ui-input", className ?? ""].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
