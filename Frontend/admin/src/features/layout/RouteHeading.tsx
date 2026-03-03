import { type ReactElement, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function headingFromPath(pathname: string): string {
  if (pathname === "/login") {
    return "Login";
  }

  if (pathname === "/pages") {
    return "Pages";
  }

  if (pathname === "/pages/new") {
    return "Create Page";
  }

  if (pathname.endsWith("/preview")) {
    return "Preview Page";
  }

  if (pathname.startsWith("/pages/")) {
    return "Edit Page";
  }

  return "CMS Admin";
}

export function RouteHeading(): ReactElement {
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [location.pathname]);

  return (
    <h1 ref={headingRef} tabIndex={-1} className="page-title">
      {headingFromPath(location.pathname)}
    </h1>
  );
}
