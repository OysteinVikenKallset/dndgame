import { type ReactElement, type ReactNode, useEffect, useRef } from "react";

type PageHeaderProps = {
  title: string;
  meta?: string;
  actions?: ReactNode;
};

export function PageHeader({
  title,
  meta,
  actions,
}: PageHeaderProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return (
    <header className="page-header">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="page-header__title">
          {title}
        </h1>
        {meta ? <p className="page-header__meta">{meta}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
