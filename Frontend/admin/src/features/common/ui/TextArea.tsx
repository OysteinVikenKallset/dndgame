import type { ReactElement, TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps): ReactElement {
  return (
    <textarea
      className={["ui-textarea", className ?? ""].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
