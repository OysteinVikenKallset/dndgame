type AlertBlockProps = {
  title: string;
  message: string;
  tone?: "info" | "warning" | "danger";
};

const toneClasses: Record<NonNullable<AlertBlockProps["tone"]>, string> = {
  info: "border-info bg-info-bg text-text",
  warning: "border-warning bg-warning-bg text-text",
  danger: "border-danger bg-danger-bg text-text",
};

export function AlertBlock({ title, message, tone = "info" }: AlertBlockProps) {
  return (
    <section
      role="status"
      className={`rounded-md border-l-4 px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-text-muted">{message}</p>
    </section>
  );
}
